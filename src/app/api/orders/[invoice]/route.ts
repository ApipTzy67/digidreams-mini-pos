import { prisma } from "@/lib/prisma";
import type { CartLine, CheckoutResponse } from "@/types/pos";

interface RouteContext {
  params: Promise<{ invoice: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { invoice } = await context.params;
  const order = await prisma.order.findUnique({
    where: { invoiceNumber: invoice },
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

  if (!order) {
    return Response.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

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

  return Response.json(response);
}
