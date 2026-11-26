import assert from "node:assert/strict";
import test from "node:test";
import { calculatePricing } from "./pricing";
import type { PromoRecord } from "./promo";
import { validatePromo } from "./promo";
import { checkoutSchema } from "./validation";

const DIGIZEN10: PromoRecord = {
  code: "DIGIZEN10",
  type: "PERCENT",
  value: 10,
  minOrder: 50000,
  isActive: true,
  startsAt: null,
  endsAt: null,
};

test("subtotal tanpa promo dikenakan PPN 10%", () => {
  const result = calculatePricing({
    lines: [
      { unitPrice: 24000, quantity: 2 },
      { unitPrice: 52000, quantity: 1 },
    ],
  });

  assert.deepEqual(result, {
    subtotal: 100000,
    discount: 0,
    tax: 10000,
    total: 110000,
  });
});

test("DIGIZEN10 memberi diskon 10% lalu PPN dihitung setelah diskon", () => {
  const result = calculatePricing({
    lines: [{ unitPrice: 100000, quantity: 1 }],
    promo: DIGIZEN10,
  });

  assert.deepEqual(result, {
    subtotal: 100000,
    discount: 10000,
    tax: 9000,
    total: 99000,
  });
});

test("promo FIXED dibatasi maksimal subtotal", () => {
  const result = calculatePricing({
    lines: [{ unitPrice: 80000, quantity: 1 }],
    promo: {
      code: "HEMAT15",
      type: "FIXED",
      value: 15000,
      minOrder: 0,
    },
  });

  assert.deepEqual(result, {
    subtotal: 80000,
    discount: 15000,
    tax: 6500,
    total: 71500,
  });

  const tooBig = calculatePricing({
    lines: [{ unitPrice: 10000, quantity: 1 }],
    promo: {
      code: "HEMAT15",
      type: "FIXED",
      value: 15000,
      minOrder: 0,
    },
  });
  assert.equal(tooBig.discount, 10000);
  assert.equal(tooBig.total, 0);
});

test("pembulatan rupiah konsisten pada diskon dan pajak", () => {
  const result = calculatePricing({
    lines: [{ unitPrice: 55555, quantity: 1 }],
    promo: DIGIZEN10,
  });

  assert.equal(result.discount, 5556);
  assert.equal(result.tax, 5000);
  assert.equal(result.total, 54999);
});

test("promo ditolak bila di bawah minimum belanja", () => {
  const result = validatePromo(DIGIZEN10, " digizen10 ", 40000);
  assert.equal(result.valid, false);
  assert.match(result.reason ?? "", /Minimum belanja/);
});

test("promo ditolak bila nonaktif atau di luar periode", () => {
  const inactive = validatePromo(
    { ...DIGIZEN10, isActive: false },
    "DIGIZEN10",
    100000,
  );
  assert.equal(inactive.valid, false);
  assert.match(inactive.reason ?? "", /tidak aktif/);

  const now = new Date("2026-11-26T10:00:00.000Z");
  const expired = validatePromo(
    {
      ...DIGIZEN10,
      endsAt: new Date("2026-11-25T00:00:00.000Z"),
    },
    "DIGIZEN10",
    100000,
    now,
  );
  assert.equal(expired.valid, false);
  assert.match(expired.reason ?? "", /kedaluwarsa/);

  const upcoming = validatePromo(
    {
      ...DIGIZEN10,
      startsAt: new Date("2026-12-01T00:00:00.000Z"),
    },
    "DIGIZEN10",
    100000,
    now,
  );
  assert.equal(upcoming.valid, false);
  assert.match(upcoming.reason ?? "", /belum berlaku/);
});

test("promo valid mengembalikan diskon yang siap dipakai checkout", () => {
  const result = validatePromo(DIGIZEN10, "digizen10", 75000);
  assert.equal(result.valid, true);
  assert.equal(result.promo?.code, "DIGIZEN10");
  assert.equal(result.discount, 7500);
});

test("payload checkout divalidasi ketat", () => {
  const valid = checkoutSchema.safeParse({
    items: [{ productId: 1, quantity: 2 }],
    promoCode: "DIGIZEN10",
    paymentMethod: "QRIS",
  });
  assert.equal(valid.success, true);

  const emptyCart = checkoutSchema.safeParse({
    items: [],
    paymentMethod: "CASH",
  });
  assert.equal(emptyCart.success, false);

  const wrongPayment = checkoutSchema.safeParse({
    items: [{ productId: 1, quantity: 1 }],
    paymentMethod: "BANK_TRANSFER",
  });
  assert.equal(wrongPayment.success, false);
});
