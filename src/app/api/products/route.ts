import { prisma } from "@/lib/prisma";
import type { ProductDTO } from "@/types/pos";

export async function GET(): Promise<Response> {
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

  const data: ProductDTO[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
  }));

  return Response.json({ products: data });
}
