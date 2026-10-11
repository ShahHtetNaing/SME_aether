import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importRows } from "./csv.js";
import { prisma } from "./db.js";
import { addLog, getStore, recordImport, setPolicy, setProfile } from "./store.js";
import type { AgentDraft, Appointment, FollowUpCustomer, Invoice } from "../types.js";
import { z } from "zod";

const DEMO_BUSINESS_ID = process.env.DEMO_BUSINESS_ID ?? "demo-business";

function asDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function loadSnapshot() {
  const store = getStore();
  try {
    const [invoices, customers, appointments, drafts, logs, imports, profiles, policies] = await Promise.all([
      prisma.invoice.findMany(),
      prisma.followUpCustomer.findMany(),
      prisma.appointment.findMany(),
      prisma.agentDraft.findMany(),
      prisma.actionLog.findMany({ orderBy: { timestamp: "desc" } }),
      prisma.datasetImport.findMany({ orderBy: { importedAt: "desc" } }),
      prisma.businessProfile.findMany(),
      prisma.reminderPolicy.findMany(),
    ]);

    store.invoices = invoices.map((row: any) => ({
      ...row,
      amountSgd: row.amountSgd,
      dueDate: row.dueDate.toISOString(),
      lastReminderAt: row.lastReminderAt?.toISOString() ?? null,
      status: row.status as Invoice["status"],
    }));
    store.customers = customers.map((row: any) => ({
      ...row,
      lastContactAt: row.lastContactAt?.toISOString() ?? null,
    }));
    store.appointments = appointments.map((row: any) => ({
      ...row,
      startsAt: row.startsAt.toISOString(),
      status: row.status as Appointment["status"],
    }));
    store.drafts = drafts.map((row: any) => ({
      ...row,
      generatedAt: row.generatedAt.toISOString(),
      agent: row.agent as AgentDraft["agent"],
      status: row.status as AgentDraft["status"],
    }));
    store.logs = logs.map((row: any) => ({
      ...row,
      timestamp: row.timestamp.toISOString(),
      agent: row.agent as (typeof store.logs)[number]["agent"],
    }));
    store.imports = imports.map((row: any) => ({
      ...row,
      importedAt: row.importedAt.toISOString(),
      kind: row.kind as (typeof store.imports)[number]["kind"],
    }));
    for (const profile of profiles) store.profiles[profile.businessId] = profile;
    for (const policy of policies) store.policies[policy.businessId] = policy;
  } catch (err) {
    console.warn("[AI Studio] Snapshot load skipped or database offline:", err);
  }
}

export async function saveSnapshot() {
  const store = getStore();
  const ops = [
    prisma.invoice.deleteMany(),
    prisma.followUpCustomer.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.agentDraft.deleteMany(),
    prisma.actionLog.deleteMany(),
    prisma.datasetImport.deleteMany(),
    prisma.businessProfile.deleteMany(),
    prisma.reminderPolicy.deleteMany(),
  ];
  if (store.invoices.length) {
    ops.push(
      prisma.invoice.createMany({
        data: store.invoices.map((row) => ({
          ...row,
          dueDate: new Date(row.dueDate),
          lastReminderAt: asDate(row.lastReminderAt),
        })),
      }),
    );
  }
  if (store.customers.length) {
    ops.push(
      prisma.followUpCustomer.createMany({
        data: store.customers.map((row) => ({
          ...row,
          lastContactAt: asDate(row.lastContactAt),
        })),
      }),
    );
  }
  if (store.appointments.length) {
    ops.push(
      prisma.appointment.createMany({
        data: store.appointments.map((row) => ({
          ...row,
          startsAt: new Date(row.startsAt),
        })),
      }),
    );
  }
  if (store.drafts.length) {
    ops.push(
      prisma.agentDraft.createMany({
        data: store.drafts.map((row) => ({
          ...row,
          generatedAt: new Date(row.generatedAt),
        })),
      }),
    );
  }
  if (store.logs.length) {
    ops.push(
      prisma.actionLog.createMany({
        data: store.logs.map((row) => ({
          ...row,
          timestamp: new Date(row.timestamp),
        })),
      }),
    );
  }
  if (store.imports.length) {
    ops.push(
      prisma.datasetImport.createMany({
        data: store.imports.map((row) => ({
          ...row,
          importedAt: new Date(row.importedAt),
        })),
      }),
    );
  }
  const profiles = Object.values(store.profiles);
  if (profiles.length) ops.push(prisma.businessProfile.createMany({ data: profiles }));
  const policies = Object.values(store.policies);
  if (policies.length) ops.push(prisma.reminderPolicy.createMany({ data: policies }));
  try {
    await prisma.$transaction(ops);
  } catch (err) {
    console.warn("[AI Studio] Snapshot save skipped or database offline:", err);
  }
}

export async function seedFromCsvIfEmpty() {
  const store = getStore();
  if (store.invoices.length || store.customers.length || store.appointments.length) return { seeded: false };

  const candidateRoots = [
    path.join(process.cwd(), "datasets"),
    path.join(process.cwd(), "../datasets"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../../../datasets"),
  ];

  let invoiceCsv = "";
  let customerCsv = "";
  let bookingCsv = "";

  for (const root of candidateRoots) {
    try {
      invoiceCsv = await readFile(path.join(root, "invoices.csv"), "utf8");
      customerCsv = await readFile(path.join(root, "customers.csv"), "utf8");
      bookingCsv = await readFile(path.join(root, "appointments.csv"), "utf8");
      if (invoiceCsv) break;
    } catch {
      // try next candidate
    }
  }

  if (!invoiceCsv) {
    console.warn("[AI Studio] Could not find datasets/ CSV files for auto-seed");
    return { seeded: false };
  }

  const businessId = DEMO_BUSINESS_ID;

  const invoices = importRows(
    invoiceCsv,
    z.object({
      invoice_number: z.string().min(1),
      customer_name: z.string().min(1),
      customer_email: z.string().email(),
      amount_sgd: z.coerce.number().positive(),
      due_date: z.string().min(8),
      status: z.enum(["unpaid", "paid", "disputed"]),
    }),
  ).rows.map((row) => ({
    id: crypto.randomUUID(),
    businessId,
    customerId: crypto.randomUUID(),
    invoiceNumber: row.invoice_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    amountSgd: row.amount_sgd,
    dueDate: new Date(row.due_date).toISOString(),
    status: row.status,
    reminderCount: 0,
    lastReminderAt: null,
  })) satisfies Invoice[];

  const customers = importRows(
    customerCsv,
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      last_contact_at: z.string().optional(),
      notes: z.string().optional(),
    }),
  ).rows.map((row) => ({
    id: crypto.randomUUID(),
    businessId,
    name: row.name,
    email: row.email,
    lastContactAt: row.last_contact_at ? new Date(row.last_contact_at).toISOString() : null,
    notes: row.notes ?? "",
    followUpCount: 0,
  })) satisfies FollowUpCustomer[];

  const appointments = importRows(
    bookingCsv,
    z.object({
      customer_name: z.string().min(1),
      customer_email: z.string().email(),
      starts_at: z.string().min(8),
      status: z.enum(["booked", "cancelled", "completed"]).default("booked"),
    }),
  ).rows.map((row) => ({
    id: crypto.randomUUID(),
    businessId,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    startsAt: new Date(row.starts_at).toISOString(),
    status: (row.status ?? "booked") as Appointment["status"],
    reminderCount: 0,
  })) satisfies Appointment[];

  store.invoices = invoices;
  store.customers = customers;
  store.appointments = appointments;
  recordImport({ businessId, filename: "invoices.csv", kind: "invoices", rowCount: invoices.length });
  recordImport({ businessId, filename: "customers.csv", kind: "customers", rowCount: customers.length });
  recordImport({ businessId, filename: "appointments.csv", kind: "appointments", rowCount: appointments.length });
  setProfile({
    businessId,
    name: "Harbour Digital Studio",
    industry: "software",
    employeeCount: 8,
    annualRevenueSgd: 1_200_000,
    isExporting: true,
    usesDigitalTools: true,
    hasGstRegistration: true,
  });
  setPolicy({
    businessId,
    minimumOverdueDays: 1,
    maxReminders: 3,
    cooldownDays: 7,
    customerFollowUpDays: 14,
    appointmentReminderHours: 24,
  });
  addLog({
    agent: "system",
    agentRunId: null,
    invoiceId: null,
    action: "seed_datasets",
    result: `invoices=${invoices.length}; customers=${customers.length}; bookings=${appointments.length}`,
  });
  await saveSnapshot();
  return { seeded: true };
}
