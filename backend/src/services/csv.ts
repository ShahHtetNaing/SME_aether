import { z } from "zod";

export function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cols[index] ?? "";
    });
    return row;
  });
}

export function importRows<T>(csv: string, schema: z.ZodType<T>) {
  const parsed = parseCsv(csv);
  const rows: T[] = [];
  const errors: { row: number; message: string }[] = [];
  parsed.forEach((raw, index) => {
    const result = schema.safeParse(raw);
    if (!result.success) {
      errors.push({ row: index + 2, message: result.error.issues[0]?.message ?? "invalid row" });
      return;
    }
    rows.push(result.data);
  });
  return { rows, errors };
}
