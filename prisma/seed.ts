import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Coffee" },
  { name: "Non-Coffee" },
  { name: "Food" },
  { name: "Coworking Space" },
];

const products = [
  { name: "Americano", category: "Coffee", price: 24000, stock: 25 },
  { name: "Cafe Latte", category: "Coffee", price: 29000, stock: 20 },
  { name: "Cold Brew", category: "Coffee", price: 32000, stock: 15 },
  { name: "Matcha Latte", category: "Non-Coffee", price: 30000, stock: 18 },
  { name: "Fresh Lemonade", category: "Non-Coffee", price: 18000, stock: 30 },
  { name: "Butter Croissant", category: "Food", price: 22000, stock: 12 },
  { name: "Chicken Sandwich", category: "Food", price: 38000, stock: 10 },
  { name: "Coworking Day Pass", category: "Coworking Space", price: 85000, stock: 8 },
];

async function main(): Promise<void> {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  const savedCategories = await prisma.category.findMany();
  const categoryIdByName = new Map(
    savedCategories.map((category) => [category.name, category.id]),
  );

  for (const product of products) {
    const categoryId = categoryIdByName.get(product.category);
    if (categoryId === undefined) {
      throw new Error(`Category not found: ${product.category}`);
    }

    await prisma.product.upsert({
      where: { name: product.name },
      update: {
        categoryId,
        price: product.price,
        stock: product.stock,
      },
      create: {
        name: product.name,
        categoryId,
        price: product.price,
        stock: product.stock,
      },
    });
  }

  await prisma.promo.upsert({
    where: { code: "DIGIZEN10" },
    update: {
      type: "PERCENT",
      value: 10,
      minOrder: 50000,
      isActive: true,
      startsAt: null,
      endsAt: null,
    },
    create: {
      code: "DIGIZEN10",
      type: "PERCENT",
      value: 10,
      minOrder: 50000,
      isActive: true,
    },
  });

  console.log(
    `Seeded ${categories.length} categories, ${products.length} products, 1 promo.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
