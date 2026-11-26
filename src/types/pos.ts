export type PaymentMethod = "CASH" | "QRIS";
export type PromoType = "PERCENT" | "FIXED";

export interface ProductDTO {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export interface CartLine {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PromoInfo {
  code: string;
  type: PromoType;
  value: number;
  minOrder: number;
}

export interface PromoValidationResult {
  valid: boolean;
  reason?: string;
  promo?: PromoInfo;
  discount?: number;
}

export interface PricingLine {
  unitPrice: number;
  quantity: number;
}

export interface PricingInput {
  lines: PricingLine[];
  promo?: PromoInfo | null;
}

export interface PricingResult {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export interface CheckoutRequest {
  items: Array<{ productId: number; quantity: number }>;
  promoCode?: string | null;
  paymentMethod: PaymentMethod;
}

export interface CheckoutResponse extends PricingResult {
  invoiceNumber: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  promoCode: string | null;
  items: CartLine[];
}

export type ReceiptDTO = CheckoutResponse;
