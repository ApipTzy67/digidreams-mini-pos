import type { Prisma } from "@prisma/client";
import { formatInvoiceNumber } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";
import { calculatePricing } from "@/lib/pricing";
import { normalizePromoCode, validatePromo } from "@/lib/promo";
import { checkoutSchema } from "@/lib/validation";
import type { CartLine, CheckoutResponse, PromoInfo } from "@/types/pos";

interface CheckoutFailure {
  status: number;
  message: string;
}

function isCheckoutFailure(error: unknown): error is CheckoutFailure {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as Partial<CheckoutFailure>;
  return (
    typeof candidate.status === "number" && typeof candidate.message === "string"
  );
}

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Permintaan checkout tidak valid." },
      { status: 400 },
    );
  }

  const quantities = new Map<number, number>();
  for (const item of parsed.data.items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, price: true, stock: true },
  });

  if (products.length !== productIds.length) {
    return Response.json(
      { error: "Beberapa produk tidak ditemukan." },
      { status: 404 },
    );
  }

  const lines = products.map((product) => ({
    unitPrice: product.price,
    quantity: quantities.get(product.id) ?? 0,
  }));
  const subtotal = calculatePricing({ lines }).subtotal;

  let appliedPromo: PromoInfo | null = null;
  if (parsed.data.promoCode) {
    const code = normalizePromoCode(parsed.data.promoCode);
    const promo = await prisma.promo.findUnique({ where: { code } });
    const validation = validatePromo(promo, code, subtotal);

    if (!validation.valid || !validation.promo) {
      return Response.json(
        { error: validation.reason ?? "Promo tidak valid." },
        { status: 422 },
      );
    }

    appliedPromo = validation.promo;
  }

  const pricing = calculatePricing({ lines, promo: appliedPromo });

  try {
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const product of products) {
        const quantity = quantities.get(product.id) ?? 0;
        const updated = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });

        if (updated.count !== 1) {
          throw {
            status: 409,
            message: `Stok ${product.name} tidak mencukupi.`,
          } satisfies CheckoutFailure;
        }
      }

      const created = await tx.order.create({
        data: {
          invoiceNumber: `TEMP-${crypto.randomUUID()}`,
          subtotal: pricing.subtotal,
          discount: pricing.discount,
          tax: pricing.tax,
          total: pricing.total,
          promoCode: appliedPromo?.code ?? null,
          paymentMethod: parsed.data.paymentMethod,
          items: {
            create: products.map((product) => {
              const quantity = quantities.get(product.id) ?? 0;
              return {
                productId: product.id,
                quantity,
                unitPrice: product.price,
                subtotal: product.price * quantity,
              };
            }),
          },
        },
      });

      return await tx.order.update({
        where: { id: created.id },
        data: { invoiceNumber: formatInvoiceNumber(created.id, created.createdAt) },
        select: {
          invoiceNumber: true,
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
          promoCode: true,
          paymentMethod: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              product: { select: { name: true } },
            },
          },
        },
      });
    });

    const response: CheckoutResponse = {
      invoiceNumber: order.invoiceNumber,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      promoCode: order.promoCode,
      items: order.items.map(
        (item): CartLine => ({
          productId: item.productId,
          name: item.product.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        }),
      ),
    };

    return Response.json(response, { status: 201 });
  } catch (error: unknown) {
    if (isCheckoutFailure(error)) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
