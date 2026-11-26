import Image from "next/image";
import { formatRupiah } from "@/lib/money";
import type { CheckoutResponse } from "@/types/pos";

interface ReceiptPaperProps {
  order: CheckoutResponse;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function ReceiptPaper({ order }: ReceiptPaperProps) {
  return (
    <article className="receipt-printable paper-grain mx-auto w-full max-w-[88mm] rounded-2xl border border-ink/20 bg-[#fffdf8] p-6 text-ink shadow-[0_20px_60px_-40px_rgba(31,27,23,0.7)]">
      <header className="flex flex-col items-center border-b border-dashed border-ink/30 pb-4 text-center">
        <Image
          src="/assets/digidreams/logo-dark.png"
          alt="DigiDreams Cafe and Space"
          width={132}
          height={32}
          className="h-8 w-auto"
        />
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-ink/60">
          Cafe and Space · Sukoharjo
        </p>
        <p className="barcode mt-4 text-lg" aria-hidden="true">
          ||| ||| | ||| || ||| ||
        </p>
      </header>

      <dl className="mt-4 space-y-1 font-mono text-[11px]">
        <div className="flex justify-between">
          <dt className="text-ink/55">Invoice</dt>
          <dd className="font-medium">{order.invoiceNumber}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/55">Waktu</dt>
          <dd>{dateFormatter.format(new Date(order.createdAt))} WIB</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink/55">Bayar</dt>
          <dd>{order.paymentMethod === "QRIS" ? "QRIS" : "Tunai"}</dd>
        </div>
        {order.promoCode !== null ? (
          <div className="flex justify-between">
            <dt className="text-ink/55">Promo</dt>
            <dd className="font-medium text-accent">{order.promoCode}</dd>
          </div>
        ) : null}
      </dl>

      <div className="my-4 border-t border-dashed border-ink/30" />

      <ul className="space-y-3 text-[11px]">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="font-mono text-ink/55">
                {item.quantity} × {formatRupiah(item.unitPrice)}
              </span>
            </span>
            <span className="font-mono">{formatRupiah(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-dashed border-ink/30" />

      <dl className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between text-ink/70">
          <dt>Subtotal</dt>
          <dd>{formatRupiah(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>Diskon</dt>
          <dd>−{formatRupiah(order.discount)}</dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>PPN 10%</dt>
          <dd>{formatRupiah(order.tax)}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-ink/30 pt-2">
          <dt className="font-sans text-sm font-bold">TOTAL</dt>
          <dd className="text-base font-medium text-brand">
            {formatRupiah(order.total)}
          </dd>
        </div>
      </dl>

      <footer className="mt-6 border-t border-dashed border-ink/30 pt-4 text-center">
        <p className="font-display text-base">Terima kasih, Digizen!</p>
        <p className="mt-1 text-[10px] text-ink/55">
          Simpan struk ini sebagai bukti pembayaran.
        </p>
      </footer>
    </article>
  );
}
