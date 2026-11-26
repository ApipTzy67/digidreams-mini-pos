import { prisma } from "@/lib/prisma";
import type { CartLine, CheckoutResponse, ProductDTO } from "@/types/pos";

export async function getProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      categoryId: true,
      category: { select: { name: true } },
      price: true,
      stock: true,
      imageUrl: true,
    },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
  }));
}

export async function getOrderByInvoice(
  invoiceNumber: string,
): Promise<CheckoutResponse | null> {
  const order = await prisma.order.findUnique({
    where: { invoiceNumber },
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

  if (order === null) {
    return null;
  }

  return {
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
}
