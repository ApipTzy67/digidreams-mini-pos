import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/pos/print-button";
import { ReceiptPaper } from "@/components/pos/receipt-paper";
import { getOrderByInvoice } from "@/lib/queries";

interface OrderPageProps {
  params: Promise<{ invoice: string }>;
}

export const instant = false;

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { invoice } = await params;
  return {
    title: `Struk ${invoice} — DigiDreams`,
    description: `Detail pembayaran dan struk digital ${invoice}.`,
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { invoice } = await params;
  const order = await getOrderByInvoice(invoice);

  if (order === null) {
    notFound();
  }

  return (
    <main className="flex-1 px-4 py-10 sm:px-8">
      <div className="no-print mx-auto mb-6 flex w-full max-w-[88mm] flex-col gap-4">
        <Link
          href="/"
          className="text-xs font-bold uppercase tracking-[0.14em] text-accent hover:underline"
        >
          ← Kembali ke menu
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/55">
              Pembayaran berhasil
            </p>
            <h1 className="font-display text-2xl text-ink">Struk digital</h1>
          </div>
          <PrintButton />
        </div>
      </div>

      <ReceiptPaper order={order} />
    </main>
  );
}
