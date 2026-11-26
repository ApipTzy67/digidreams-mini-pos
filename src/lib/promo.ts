import type {
  PromoInfo,
  PromoType,
  PromoValidationResult,
} from "../types/pos";
import { formatRupiah } from "./money";
import { calculateDiscount } from "./pricing";

export interface PromoRecord extends PromoInfo {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function validatePromo(
  promo: PromoRecord | null,
  rawCode: string,
  subtotal: number,
  now: Date = new Date(),
): PromoValidationResult {
  const code = normalizePromoCode(rawCode);

  if (code.length === 0) {
    return { valid: false, reason: "Masukkan kode promo terlebih dahulu." };
  }

  if (!promo || normalizePromoCode(promo.code) !== code) {
    return { valid: false, reason: "Kode promo tidak ditemukan." };
  }

  if (!promo.isActive) {
    return { valid: false, reason: "Kode promo sudah tidak aktif." };
  }

  if (promo.startsAt !== null && now < promo.startsAt) {
    return { valid: false, reason: "Kode promo belum berlaku." };
  }

  if (promo.endsAt !== null && now > promo.endsAt) {
    return { valid: false, reason: "Kode promo sudah kedaluwarsa." };
  }

  if (subtotal < promo.minOrder) {
    return {
      valid: false,
      reason: `Minimum belanja ${formatRupiah(promo.minOrder)} untuk promo ini.`,
    };
  }

  const promoInfo: PromoInfo = {
    code: normalizePromoCode(promo.code),
    type: promo.type as PromoType,
    value: promo.value,
    minOrder: promo.minOrder,
  };

  return {
    valid: true,
    promo: promoInfo,
    discount: calculateDiscount(subtotal, promoInfo),
  };
}
