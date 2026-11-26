import { z } from "zod";

const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string(),
  unitPrice: z.number().int().nonnegative(),
  quantity: z.number().int().positive(),
  subtotal: z.number().int().nonnegative(),
});

const checkoutResponseSchema = z.object({
  invoiceNumber: z.string(),
  subtotal: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  createdAt: z.string(),
  promoCode: z.string().nullable(),
  items: z.array(cartLineSchema),
});

const promoValidationSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  promo: z
    .object({
      code: z.string(),
      type: z.enum(["PERCENT", "FIXED"]),
      value: z.number().int().nonnegative(),
      minOrder: z.number().int().nonnegative(),
    })
    .optional(),
  discount: z.number().int().nonnegative().optional(),
});

const errorSchema = z.object({
  error: z.string().optional(),
  reason: z.string().optional(),
});

export async function parseJson<T>(
  response: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new Error("Respons server tidak dikenali.");
  }

  return parsed.data;
}

export async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = errorSchema.safeParse(body);

  if (!parsed.success) {
    return "Permintaan gagal. Silakan coba lagi.";
  }

  return (
    parsed.data.error ?? parsed.data.reason ?? "Permintaan gagal. Silakan coba lagi."
  );
}

export { checkoutResponseSchema, promoValidationSchema };
