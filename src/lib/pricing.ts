import type { PricingInput, PricingLine, PricingResult } from "../types/pos";
import { roundRupiah } from "./money";

export const TAX_RATE = 0.1;

export function calculateSubtotal(lines: PricingLine[]): number {
  return lines.reduce(
    (subtotal, line) => subtotal + line.unitPrice * line.quantity,
    0,
  );
}

export function calculateDiscount(
  subtotal: number,
  promo: PricingInput["promo"],
): number {
  if (!promo || subtotal <= 0) {
    return 0;
  }

  if (promo.type === "PERCENT") {
    return Math.min(subtotal, roundRupiah((subtotal * promo.value) / 100));
  }

  return Math.min(subtotal, promo.value);
}

export function calculateTax(afterDiscount: number): number {
  return roundRupiah(afterDiscount * TAX_RATE);
}

export function calculatePricing(input: PricingInput): PricingResult {
  const subtotal = calculateSubtotal(input.lines);
  const discount = calculateDiscount(subtotal, input.promo ?? null);
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = calculateTax(afterDiscount);

  return {
    subtotal,
    discount,
    tax,
    total: afterDiscount + tax,
  };
}
