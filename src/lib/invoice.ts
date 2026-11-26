export function formatInvoiceNumber(id: number, createdAt: Date): string {
  const year = createdAt.getUTCFullYear();
  const sequence = String(id).padStart(3, "0");
  return `INV-${year}-${sequence}`;
}
