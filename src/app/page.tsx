import { PosShell } from "@/components/pos/pos-shell";
import { getProducts } from "@/lib/queries";

export const instant = false;

export default async function Home() {
  const products = await getProducts();

  return <PosShell products={products} />;
}
