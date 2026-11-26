"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ReceiptPaper } from "@/components/pos/receipt-paper";
import type { CheckoutResponse } from "@/types/pos";

interface ReceiptDialogProps {
  order: CheckoutResponse;
  onClose: () => void;
}

export function ReceiptDialog({ order, onClose }: ReceiptDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables === undefined || focusables.length === 0) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="receipt-dialog-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/65 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-dialog-title"
        className="receipt-dialog-panel w-full max-w-md rounded-3xl border border-ink/20 bg-canvas p-4 shadow-2xl"
      >
        <div className="no-print mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              Pembayaran berhasil
            </p>
            <h2
              id="receipt-dialog-title"
              className="font-display text-2xl leading-tight text-ink"
            >
              Struk digital kamu
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup struk"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 text-xl text-ink hover:border-brand hover:text-brand"
          >
            ×
          </button>
        </div>

        <ReceiptPaper order={order} />

        <div className="no-print mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/orders/${order.invoiceNumber}`}
            className="flex h-12 items-center justify-center rounded-xl border border-ink/20 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Buka halaman
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="h-12 rounded-xl bg-ink text-sm font-bold uppercase tracking-[0.12em] text-canvas hover:bg-brand"
          >
            Cetak struk
          </button>
        </div>
      </div>
    </div>
  );
}
