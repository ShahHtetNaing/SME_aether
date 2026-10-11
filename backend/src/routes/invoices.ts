import { Router } from "express";
import { z } from "zod";
import type { TenantRequest } from "../middleware/tenant.js";
import { getPolicy, getStore } from "../services/store.js";
import { isEligible } from "../services/overdue.js";
import { importRows } from "../services/csv.js";
import type { Invoice, InvoiceStatus } from "../types.js";

const router = Router();

const csvRowSchema = z.object({
  invoice_number: z.string().min(1),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  amount_sgd: z.coerce.number().positive(),
  due_date: z.string().min(8),
  status: z.enum(["unpaid", "paid", "disputed"]),
});

router.post("/", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    invoiceNumber: z.string().min(1),
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    amountSgd: z.coerce.number().positive(),
    dueDate: z.string().min(8),
    status: z.enum(["unpaid", "paid", "disputed"]).default("unpaid"),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data;
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    businessId,
    customerId: crypto.randomUUID(),
    invoiceNumber: data.invoiceNumber,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    amountSgd: data.amountSgd,
    dueDate: new Date(data.dueDate).toISOString(),
    status: data.status as InvoiceStatus,
    reminderCount: 0,
    lastReminderAt: null,
  };
  getStore().invoices.unshift(invoice);
  res.json({ invoice });
});

router.post("/import", (req, res) => {
  const { businessId } = req as TenantRequest;
  const csv = typeof req.body?.csv === "string" ? req.body.csv : "";
  if (!csv.trim()) {
    return res.status(400).json({ error: "No CSV provided. Dataset work is deferred; paste CSV later." });
  }

  const { rows, errors } = importRows(csv, csvRowSchema);
  const store = getStore();
  const imported: Invoice[] = rows.map((data) => {
    const invoice: Invoice = {
      id: crypto.randomUUID(),
      businessId,
      customerId: crypto.randomUUID(),
      invoiceNumber: data.invoice_number,
      customerName: data.customer_name,
      customerEmail: data.customer_email,
      amountSgd: data.amount_sgd,
      dueDate: new Date(data.due_date).toISOString(),
      status: data.status as InvoiceStatus,
      reminderCount: 0,
      lastReminderAt: null,
    };
    store.invoices.unshift(invoice);
    return invoice;
  });

  return res.json({ imported: imported.length, errors, invoices: imported });
});

router.get("/", (req, res) => {
  const { businessId } = req as TenantRequest;
  const invoices = getStore().invoices.filter((invoice) => invoice.businessId === businessId);
  res.json({ invoices });
});

router.get("/overdue", (req, res) => {
  const { businessId } = req as TenantRequest;
  const policy = getPolicy(businessId);
  const invoices = getStore()
    .invoices.filter((invoice) => invoice.businessId === businessId)
    .map((invoice) => ({ invoice, eligibility: isEligible(invoice, policy) }))
    .filter((row) => row.eligibility.ok)
    .map((row) => ({ ...row.invoice, reason: row.eligibility.reason }));
  res.json({ invoices });
});

export default router;
