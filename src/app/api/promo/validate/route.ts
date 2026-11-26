import { prisma } from "@/lib/prisma";
import { normalizePromoCode, validatePromo } from "@/lib/promo";
import { promoSchema } from "@/lib/validation";

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null);
  const parsed = promoSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { valid: false, reason: "Permintaan promo tidak valid." },
      { status: 400 },
    );
  }

  const code = normalizePromoCode(parsed.data.code);
  const promo = await prisma.promo.findUnique({ where: { code } });
  const result = validatePromo(promo, code, parsed.data.subtotal);

  return Response.json(result);
}
