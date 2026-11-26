"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  parseJson,
  promoValidationSchema,
  checkoutResponseSchema,
  readErrorMessage,
} from "@/lib/api-client";
import { formatRupiah } from "@/lib/money";
import { calculatePricing } from "@/lib/pricing";
import { CartPanel } from "@/components/pos/cart-panel";
import { ProductCard } from "@/components/pos/product-card";
import { ReceiptDialog } from "@/components/pos/receipt-dialog";
import type {
  CartLine,
  CheckoutResponse,
  PaymentMethod,
  ProductDTO,
  PromoInfo,
  PromoValidationResult,
} from "@/types/pos";

interface PosShellProps {
  products: ProductDTO[];
}

export function PosShell({ products }: PosShellProps) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoInfo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<CheckoutResponse | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const categories = useMemo(
    () => ["Semua", ...new Set(products.map((product) => product.categoryName))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id-ID");
    return products.filter((product) => {
      const matchesCategory =
        category === "Semua" || product.categoryName === category;
      const matchesQuery =
        needle.length === 0 ||
        product.name.toLocaleLowerCase("id-ID").includes(needle) ||
        product.categoryName.toLocaleLowerCase("id-ID").includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  const cartLines = useMemo<CartLine[]>(
    () =>
      products.flatMap((product) => {
        const quantity = quantities[product.id] ?? 0;
        if (quantity <= 0) {
          return [];
        }
        return [
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity,
            subtotal: product.price * quantity,
          },
        ];
      }),
    [products, quantities],
  );

  const subtotal = useMemo(
    () => cartLines.reduce((total, line) => total + line.subtotal, 0),
    [cartLines],
  );

  const promoBelowMinimum =
    appliedPromo !== null && subtotal < appliedPromo.minOrder;
  const effectivePromo = promoBelowMinimum ? null : appliedPromo;
  const displayedPromoError =
    promoError ??
    (promoBelowMinimum && appliedPromo !== null
      ? `Promo dilepas: minimum belanja ${formatRupiah(appliedPromo.minOrder)}.`
      : null);

  const pricing = useMemo(
    () =>
      calculatePricing({
        lines: cartLines.map((line) => ({
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
        promo: effectivePromo,
      }),
    [cartLines, effectivePromo],
  );

  const itemCount = cartLines.reduce((total, line) => total + line.quantity, 0);

  const changeQuantity = useCallback(
    (productId: number, nextQuantity: number) => {
      setQuantities((previous) => {
        const updated = { ...previous };
        const max = productsById.get(productId)?.stock ?? 0;
        if (nextQuantity < 1 || max <= 0) {
          delete updated[productId];
        } else {
          updated[productId] = Math.min(nextQuantity, max);
        }
        return updated;
      });
    },
    [productsById],
  );

  const addProduct = useCallback(
    (product: ProductDTO) => {
      setQuantities((previous) => {
        const updated = { ...previous };
        const max = product.stock;
        if (max <= 0) {
          return updated;
        }
        updated[product.id] = Math.min(
          (updated[product.id] ?? 0) + 1,
          max,
        );
        return updated;
      });
    },
    [],
  );

  const removeProduct = useCallback((productId: number) => {
    setQuantities((previous) => {
      const updated = { ...previous };
      delete updated[productId];
      return updated;
    });
  }, []);

  const clearPromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoError(null);
  }, []);

  const applyPromo = useCallback(async () => {
    setPromoLoading(true);
    setPromoError(null);

    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: promoInput,
          subtotal: pricing.subtotal,
        }),
      });
      const result: PromoValidationResult = await parseJson(
        response,
        promoValidationSchema,
      );

      if (!response.ok || !result.valid || result.promo === undefined) {
        setAppliedPromo(null);
        setPromoError(result.reason ?? "Promo tidak dapat dipakai.");
        return;
      }

      setAppliedPromo(result.promo);
    } catch (error: unknown) {
      setAppliedPromo(null);
      setPromoError(
        error instanceof Error ? error.message : "Promo gagal diperiksa.",
      );
    } finally {
      setPromoLoading(false);
    }
  }, [promoInput, pricing.subtotal]);

  const checkout = useCallback(async () => {
    if (cartLines.length === 0) {
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cartLines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          promoCode: effectivePromo?.code ?? null,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        setCheckoutError(await readErrorMessage(response));
        if (response.status === 409) {
          router.refresh();
        }
        return;
      }

      const order = await parseJson(response, checkoutResponseSchema);
      setReceipt(order);
      setQuantities({});
      clearPromo();
      setPromoInput("");
      setMobileCartOpen(false);
      router.refresh();
    } catch (error: unknown) {
      setCheckoutError(
        error instanceof Error ? error.message : "Checkout gagal. Coba lagi.",
      );
    } finally {
      setCheckingOut(false);
    }
  }, [cartLines, effectivePromo, paymentMethod, router, clearPromo]);

  const closeReceipt = useCallback(() => setReceipt(null), []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (event.key === "/" && !isTyping && receipt === null) {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === "Escape") {
        setMobileCartOpen(false);
        if (receipt !== null) {
          closeReceipt();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [receipt, closeReceipt]);

  const cartPanelProps = {
    lines: cartLines,
    productsById,
    pricing,
    promoInput,
    appliedPromo: effectivePromo,
    promoLoading,
    promoError: displayedPromoError,
    paymentMethod,
    checkingOut,
    checkoutError,
    onQuantityChange: changeQuantity,
    onRemove: removeProduct,
    onPromoInputChange: setPromoInput,
    onApplyPromo: applyPromo,
    onClearPromo: clearPromo,
    onPaymentMethodChange: setPaymentMethod,
    onCheckout: checkout,
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-[1500px] items-center justify-between gap-4 px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/digidreams/logo-dark.png"
              alt="DigiDreams Cafe and Space"
              width={140}
              height={34}
              priority
              className="h-8 w-auto sm:h-9"
            />
            <span className="hidden border-l border-ink/20 pl-3 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/55 sm:inline">
              Mini POS
            </span>
          </div>
          <p className="hidden text-xs text-ink/55 md:block">
            Buka setiap hari · 09.00 — 02.00 WIB
          </p>
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-ink/20 px-4 text-sm font-bold text-ink lg:hidden"
          >
            Tiket
            <span className="rounded-full bg-brand px-2 py-0.5 font-mono text-xs text-white">
              {itemCount}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8 lg:py-10">
        <section aria-labelledby="menu-heading" className="min-w-0">
          <div className="mb-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand">
              Pesan di tempat · ambil sendiri
            </p>
            <h1
              id="menu-heading"
              className="mt-2 font-display text-4xl leading-[1.05] text-ink sm:text-5xl"
            >
              Menu hari ini,
              <br />
              <span className="text-accent">dibuat segar.</span>
            </h1>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="menu-search" className="sr-only">
                Cari menu
              </label>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/40"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                id="menu-search"
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari Americano, matcha, coworking…"
                className="h-12 w-full rounded-2xl border border-ink/20 bg-[#fffdf8] pl-11 pr-14 text-sm text-ink placeholder:text-ink/40"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-ink/20 bg-canvas px-2 py-0.5 font-mono text-xs text-ink/50 sm:block">
                /
              </kbd>
            </div>
          </div>

          <div
            className="mb-5 flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter kategori"
          >
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`h-10 shrink-0 rounded-full border px-4 text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                  category === item
                    ? "border-ink bg-ink text-canvas"
                    : "border-ink/20 text-ink/65 hover:border-ink/45 hover:text-ink"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <p className="mb-4 text-xs text-ink/55" aria-live="polite">
            Menampilkan <strong className="text-ink">{filteredProducts.length}</strong>{" "}
            dari {products.length} menu
          </p>

          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/25 bg-[#fffdf8] p-12 text-center">
              <p className="font-display text-2xl text-ink">
                Menu tidak ditemukan.
              </p>
              <p className="mt-2 text-sm text-ink/60">
                Coba kata kunci lain atau pilih kategori “Semua”.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("Semua");
                }}
                className="mt-5 h-11 rounded-xl bg-ink px-5 text-sm font-bold text-canvas hover:bg-brand"
              >
                Reset pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantities[product.id] ?? 0}
                  onAdd={() => addProduct(product)}
                  onRemove={() => changeQuantity(product.id, (quantities[product.id] ?? 0) - 1)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
            <CartPanel {...cartPanelProps} />
          </div>
        </aside>
      </main>

      <div className="no-print sticky bottom-0 z-20 border-t border-ink/15 bg-canvas/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/55">
              Total sementara
            </p>
            <p aria-live="polite" className="font-mono text-lg font-medium text-brand">
              {formatRupiah(pricing.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="h-12 rounded-xl bg-brand px-5 text-xs font-bold uppercase tracking-[0.14em] text-white"
          >
            Lihat tiket ({itemCount})
          </button>
        </div>
      </div>

      {mobileCartOpen ? (
        <div
          className="no-print fixed inset-0 z-40 bg-ink/60 lg:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileCartOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tiket pesanan"
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-canvas p-3"
          >
            <CartPanel {...cartPanelProps} onClose={() => setMobileCartOpen(false)} />
          </div>
        </div>
      ) : null}

      {receipt !== null ? (
        <ReceiptDialog order={receipt} onClose={closeReceipt} />
      ) : null}
    </div>
  );
}
