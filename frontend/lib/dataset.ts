export type DatasetKind = "invoices" | "customers" | "appointments";

export function classifyCsv(text: string, filename = ""): DatasetKind | null {
  const name = filename.toLowerCase();
  if (name.includes("invoice")) return "invoices";
  if (name.includes("customer")) return "customers";
  if (name.includes("book") || name.includes("appoint")) return "appointments";
  const header = (text.split(/\r?\n/).find((line) => line.trim()) ?? "").toLowerCase();
  if (header.includes("invoice_number")) return "invoices";
  if (header.includes("starts_at")) return "appointments";
  if (header.includes("last_contact") || header.startsWith("name,email")) return "customers";
  return null;
}
