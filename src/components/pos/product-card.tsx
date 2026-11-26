"use client";

import Image from "next/image";
import { formatRupiah } from "@/lib/money";
import type { ProductDTO } from "@/types/pos";

interface ProductCardProps {
  product: ProductDTO;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onRemove,
}: ProductCardProps) {
  const soldOut = product.stock <= 0;
  const atLimit = quantity >= product.stock;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-ink/15 bg-[#fffdf8] transition-transform duration-200 hover:-translate-y-0.5 hover:border-ink/30">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand/50">
        {product.imageUrl === null ? (
          <div className="flex h-full items-center justify-center font-display text-4xl text-ink/25">
            {product.name.slice(0, 1)}
          </div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full border border-ink/10 bg-canvas/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/70">
          {product.categoryName}
        </span>
        {quantity > 0 ? (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            {quantity} di tiket
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-xl leading-tight text-ink">
          {product.name}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="font-mono text-lg font-medium text-brand">
              {formatRupiah(product.price)}
            </p>
            <p className="mt-0.5 text-xs text-ink/55">
              {soldOut ? "Stok habis" : `Sisa ${product.stock}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {quantity > 0 ? (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Kurangi ${product.name}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/20 text-lg font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                −
              </button>
            ) : null}
            <button
              type="button"
              onClick={onAdd}
              disabled={soldOut || atLimit}
              aria-label={`Tambah ${product.name}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-xl font-semibold text-canvas transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:bg-ink/25"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
