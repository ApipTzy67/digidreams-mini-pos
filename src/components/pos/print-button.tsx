"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-12 rounded-xl bg-ink px-6 text-sm font-bold uppercase tracking-[0.12em] text-canvas transition-colors hover:bg-brand"
    >
      Cetak struk
    </button>
  );
}
