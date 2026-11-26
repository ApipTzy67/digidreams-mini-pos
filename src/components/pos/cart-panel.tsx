"use client";

import { formatRupiah } from "@/lib/money";
import type {
  CartLine,
  PaymentMethod,
  PricingResult,
  ProductDTO,
  PromoInfo,
} from "@/types/pos";

interface CartPanelProps {
  lines: CartLine[];
  productsById: Map<number, ProductDTO>;
  pricing: PricingResult;
  promoInput: string;
  appliedPromo: PromoInfo | null;
  promoLoading: boolean;
  promoError: string | null;
  paymentMethod: PaymentMethod;
  checkingOut: boolean;
  checkoutError: string | null;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onPromoInputChange: (value: string) => void;
  onApplyPromo: () => void;
  onClearPromo: () => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onCheckout: () => void;
  onClose?: () => void;
}

export function CartPanel({
  lines,
  productsById,
  pricing,
  promoInput,
  appliedPromo,
  promoLoading,
  promoError,
  paymentMethod,
  checkingOut,
  checkoutError,
  onQuantityChange,
  onRemove,
  onPromoInputChange,
  onApplyPromo,
  onClearPromo,
  onPaymentMethodChange,
  onCheckout,
  onClose,
}: CartPanelProps) {
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <section
      aria-label="Tiket pesanan"
      className="flex h-full flex-col gap-5 rounded-3xl border border-ink/20 bg-[#fffdf8] p-5 shadow-[0_18px_45px_-32px_rgba(31,27,23,0.55)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
            Tiket pesanan
          </p>
          <h2 className="mt-1 font-display text-2xl leading-none text-ink">
            Digi<span className="text-brand">Dreams</span>
          </h2>
          <p className="barcode mt-3 text-xs text-ink/60" aria-hidden="true">
            ||| ||| || | ||| ||| ||
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-ink/15 px-3 py-1 font-mono text-xs text-ink/70">
            {itemCount} item
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup tiket"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-lg text-ink hover:border-brand hover:text-brand"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className="ticket-card flex min-h-24 flex-col gap-3 rounded-2xl p-4">
        {lines.length === 0 ? (
          <div className="py-4 text-center">
            <p className="font-display text-lg text-ink">Tiket masih kosong.</p>
            <p className="mt-1 text-sm text-ink/60">
              Pilih menu di sebelah kiri untuk mulai memesan.
            </p>
          </div>
        ) : (
          lines.map((line) => {
            const product = productsById.get(line.productId);
            const max = product?.stock ?? line.quantity;
            return (
              <div
                key={line.productId}
                className="flex items-start justify-between gap-3 border-b border-dashed border-ink/15 pb-3 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {line.name}
                  </p>
                  <p className="font-mono text-xs text-ink/55">
                    {formatRupiah(line.unitPrice)} × {line.quantity}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(line.productId, line.quantity - 1)}
                      aria-label={`Kurangi ${line.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/20 text-base text-ink hover:border-brand hover:text-brand"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={max}
                      value={line.quantity}
                      onChange={(event) => {
                        const next = Number.parseInt(event.target.value, 10);
                        onQuantityChange(
                          line.productId,
                          Number.isNaN(next) ? 1 : next,
                        );
                      }}
                      aria-label={`Jumlah ${line.name}`}
                      className="h-9 w-12 rounded-lg border border-ink/20 bg-transparent text-center font-mono text-sm text-ink"
                    />
                    <button
                      type="button"
                      onClick={() => onQuantityChange(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= max}
                      aria-label={`Tambah ${line.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink/20 text-base text-ink hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(line.productId)}
                      aria-label={`Hapus ${line.name} dari tiket`}
                      className="ml-auto flex h-9 items-center rounded-lg px-2 text-xs font-semibold text-brand hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <p className="font-mono text-sm font-medium text-ink">
                  {formatRupiah(line.subtotal)}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApplyPromo();
        }}
        className="space-y-2"
      >
        <label htmlFor="promo-code" className="text-xs font-bold uppercase tracking-[0.12em] text-ink/70">
          Kode promo
        </label>
        <div className="flex gap-2">
          <input
            id="promo-code"
            value={promoInput}
            onChange={(event) => onPromoInputChange(event.target.value)}
            placeholder="DIGIZEN10"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-xl border border-ink/20 bg-canvas/70 px-3 font-mono text-sm uppercase tracking-wider text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/35"
          />
          {appliedPromo !== null ? (
            <button
              type="button"
              onClick={onClearPromo}
              className="h-11 rounded-xl border border-ink/20 px-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
            >
              Lepas
            </button>
          ) : (
            <button
              type="submit"
              disabled={promoLoading || lines.length === 0}
              className="h-11 rounded-xl bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-[#24584e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {promoLoading ? "..." : "Pakai"}
            </button>
          )}
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-brand">
          {promoError ??
            (appliedPromo !== null
              ? `${appliedPromo.code} aktif · hemat ${formatRupiah(pricing.discount)}`
              : "Coba DIGIZEN10 — diskon 10%, min. Rp 50.000.")}
        </p>
      </form>

      <dl className="space-y-2 border-t border-dashed border-ink/20 pt-4 text-sm">
        <div className="flex justify-between text-ink/70">
          <dt>Subtotal</dt>
          <dd className="font-mono">{formatRupiah(pricing.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>Diskon</dt>
          <dd className="font-mono text-accent">
            −{formatRupiah(pricing.discount)}
          </dd>
        </div>
        <div className="flex justify-between text-ink/70">
          <dt>PPN 10%</dt>
          <dd className="font-mono">{formatRupiah(pricing.tax)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-ink/20 pt-3">
          <dt className="font-display text-lg text-ink">Total</dt>
          <dd
            aria-live="polite"
            className="font-mono text-2xl font-medium text-brand"
          >
            {formatRupiah(pricing.total)}
          </dd>
        </div>
      </dl>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-ink/70">
          Pembayaran
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {(["CASH", "QRIS"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => onPaymentMethodChange(method)}
              aria-pressed={paymentMethod === method}
              className={`h-11 rounded-xl border text-sm font-bold transition-colors ${
                paymentMethod === method
                  ? "border-ink bg-ink text-canvas"
                  : "border-ink/20 text-ink/70 hover:border-ink/40"
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </fieldset>

      {checkoutError !== null ? (
        <p role="alert" className="rounded-xl bg-brand/10 p-3 text-sm text-brand">
          {checkoutError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCheckout}
        disabled={lines.length === 0 || checkingOut}
        className="mt-auto h-14 w-full rounded-2xl bg-brand px-5 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#c84520] disabled:cursor-not-allowed disabled:bg-ink/20"
      >
        {checkingOut ? "Memproses…" : `Bayar ${formatRupiah(pricing.total)}`}
      </button>
    </section>
  );
}
