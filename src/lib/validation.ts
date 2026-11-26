import { z } from "zod";

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Keranjang masih kosong."),
  promoCode: z.string().trim().min(1).max(32).nullish(),
  paymentMethod: z.enum(["CASH", "QRIS"]),
});

export const promoSchema = z.object({
  code: z.string().trim().min(1).max(32),
  subtotal: z.number().int().nonnegative(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PromoInput = z.infer<typeof promoSchema>;
