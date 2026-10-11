import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getStore,
  getPolicy,
  setPolicy,
  getProfile,
  setProfile,
  addLog,
  recordImport,
} from "../../../../backend/src/services/store";
import { loadSnapshot, saveSnapshot, seedFromCsvIfEmpty } from "../../../../backend/src/services/persist";
import { isEligible } from "../../../../backend/src/services/overdue";
import { importRows } from "../../../../backend/src/services/csv";
import { createTools } from "../../../../agents/tools/index";
import {
  runAllAgents,
  runAppointmentAgent,
  runComplianceAgent,
  runCustomerAgent,
  runGrantAgent,
  runInvoiceAgent,
} from "../../../../agents/runners/run";
import { GRANT_CATALOG } from "../../../../agents/catalogs/grants";
import { COMPLIANCE_CATALOG } from "../../../../agents/catalogs/compliance";
import type { Appointment, FollowUpCustomer, Invoice, InvoiceStatus, AgentKind, AgentDraft } from "../../../../backend/src/types";

const DEMO_BUSINESS_ID = process.env.DEMO_BUSINESS_ID ?? "demo-business";

let isReady = false;
async function ensureReady() {
  if (isReady) return;
  isReady = true;
  try {
    await loadSnapshot();
    await seedFromCsvIfEmpty();
  } catch (err) {
    console.error("[AI Studio] Error initializing store:", err);
  }
}

const csvRowSchema = z.object({
  invoice_number: z.string().min(1),
  customer_name: z.string().min(1),
  customer_email: z.string().email(),
  amount_sgd: z.coerce.number().positive(),
  due_date: z.string().min(8),
  status: z.enum(["unpaid", "paid", "disputed"]),
});

function draftInTenant(businessId: string, recordId: string, agent: AgentKind) {
  const store = getStore();
  if (agent === "invoice") return store.invoices.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "customer") return store.customers.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "appointment") return store.appointments.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "grant" || agent === "compliance") return true;
  return false;
}

function listPending(businessId: string) {
  const store = getStore();
  return store.drafts
    .filter((draft) => (draft.status === "pending" || draft.status === "approved") && draftInTenant(businessId, draft.recordId, draft.agent))
    .map((draft) => ({
      ...draft,
      invoice: store.invoices.find((invoice) => invoice.id === draft.recordId),
      customer: store.customers.find((row) => row.id === draft.recordId),
      appointment: store.appointments.find((row) => row.id === draft.recordId),
    }));
}

export async function GET(req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  await ensureReady();
  const { slug = [] } = await params;
  const path = slug.join("/");
  const businessId = DEMO_BUSINESS_ID;
  const store = getStore();

  if (path === "health" || path === "") {
    return NextResponse.json({ ok: true, service: "aether", dataset: "sqlite" });
  }

  // Dashboard stats
  if (path === "dashboard/stats") {
    const policy = getPolicy(businessId);
    const profile = getProfile(businessId);
    const invoices = store.invoices.filter((invoice) => invoice.businessId === businessId);
    const overdue = invoices.filter((invoice) => isEligible(invoice, policy).ok);
    const customers = store.customers.filter((row) => row.businessId === businessId);
    const appointments = store.appointments.filter((row) => row.businessId === businessId);
    const grantMatches = GRANT_CATALOG.filter((grant) => grant.match(profile).ok);
    const complianceGaps = COMPLIANCE_CATALOG.filter((item) => item.appliesWhen(profile)).length;
    const drafts = store.drafts.filter((draft) => draft.status === "pending" || draft.status === "approved");

    return NextResponse.json({
      datasetReady: invoices.length > 0,
      profileReady: Boolean(profile.industry),
      totals: {
        invoices: invoices.length,
        overdue: overdue.length,
        overdueAmount: overdue.reduce((sum, invoice) => sum + invoice.amountSgd, 0),
        pendingApprovals: drafts.filter((draft) => draft.status === "pending").length,
        sent: store.drafts.filter((draft) => draft.status === "sent" || draft.status === "completed").length,
        customers: customers.length,
        appointments: appointments.length,
        grantMatches: grantMatches.length,
        complianceGaps,
      },
      agents: [
        { id: "invoice", name: "Collections", records: invoices.length, readyHint: invoices.length ? "Records loaded" : "Add rows in Datasets" },
        { id: "grant", name: "Grants", records: grantMatches.length, readyHint: profile.industry ? "Matched from profile" : "Set industry in Settings" },
        { id: "customer", name: "Follow-ups", records: customers.length, readyHint: customers.length ? "Records loaded" : "Add rows in Datasets" },
        { id: "compliance", name: "Compliance", records: complianceGaps, readyHint: "Based on profile and evidence" },
        { id: "appointment", name: "Bookings", records: appointments.length, readyHint: appointments.length ? "Records loaded" : "Add rows in Datasets" },
      ],
      recentActivity: store.logs.slice(0, 8),
      policy,
      profile,
    });
  }

  if (path === "dashboard/policy") {
    return NextResponse.json({ policy: getPolicy(businessId) });
  }

  // Invoices
  if (path === "invoices") {
    const invoices = store.invoices.filter((invoice) => invoice.businessId === businessId);
    return NextResponse.json({ invoices });
  }

  if (path === "invoices/overdue") {
    const policy = getPolicy(businessId);
    const invoices = store.invoices
      .filter((invoice) => invoice.businessId === businessId)
      .map((invoice) => ({ invoice, eligibility: isEligible(invoice, policy) }))
      .filter((row) => row.eligibility.ok)
      .map((row) => ({ ...row.invoice, reason: row.eligibility.reason }));
    return NextResponse.json({ invoices });
  }

  // Reminders / Drafts
  if (path === "reminders/pending") {
    let drafts = listPending(businessId);
    if (drafts.length === 0) {
      await runAllAgents(businessId);
      drafts = listPending(businessId);
      await saveSnapshot();
    }
    return NextResponse.json({ drafts });
  }

  // Agent activity
  if (path === "agent/activity") {
    return NextResponse.json({
      logs: store.logs.filter(
        (log) => store.runs.some((run) => run.id === log.agentRunId && run.businessId === businessId) || log.agentRunId === null,
      ),
      runs: store.runs.filter((run) => run.businessId === businessId),
    });
  }

  // Workspace records
  if (path === "workspace/records") {
    return NextResponse.json({
      invoices: store.invoices.filter((row) => row.businessId === businessId),
      customers: store.customers.filter((row) => row.businessId === businessId),
      appointments: store.appointments.filter((row) => row.businessId === businessId),
      files: store.imports.filter((row) => row.businessId === businessId),
    });
  }

  if (path === "workspace/profile") {
    return NextResponse.json({ profile: getProfile(businessId) });
  }

  if (path === "workspace/grants") {
    const profile = getProfile(businessId);
    const grants = GRANT_CATALOG.map((grant) => ({
      id: grant.id,
      name: grant.name,
      agency: grant.agency,
      summary: grant.summary,
      checklist: grant.checklist,
      match: grant.match(profile),
    }));
    return NextResponse.json({ grants, profileReady: Boolean(profile.industry) });
  }

  if (path === "workspace/customers") {
    return NextResponse.json({ customers: store.customers.filter((row) => row.businessId === businessId) });
  }

  if (path === "workspace/compliance") {
    const profile = getProfile(businessId);
    const requirements = COMPLIANCE_CATALOG.map((reqItem) => {
      const evidence = store.evidence.find((row) => row.businessId === businessId && row.requirementId === reqItem.id);
      return {
        id: reqItem.id,
        framework: reqItem.framework,
        title: reqItem.title,
        summary: reqItem.summary,
        applies: reqItem.appliesWhen(profile),
        evidenceStatus: evidence?.status ?? "missing",
      };
    });
    return NextResponse.json({ requirements });
  }

  if (path === "workspace/appointments") {
    return NextResponse.json({ appointments: store.appointments.filter((row) => row.businessId === businessId) });
  }

  return NextResponse.json({ error: `Not found: /api/${path}` }, { status: 404 });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  await ensureReady();
  const { slug = [] } = await params;
  const path = slug.join("/");
  const businessId = DEMO_BUSINESS_ID;
  const store = getStore();

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Invoices create
  if (path === "invoices") {
    const schema = z.object({
      invoiceNumber: z.string().min(1),
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      amountSgd: z.coerce.number().positive(),
      dueDate: z.string().min(8),
      status: z.enum(["unpaid", "paid", "disputed"]).default("unpaid"),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
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
    store.invoices.unshift(invoice);
    return NextResponse.json({ invoice });
  }

  // Invoices import
  if (path === "invoices/import") {
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const filename = typeof body?.filename === "string" && body.filename.trim() ? body.filename.trim() : "invoices.csv";
    if (!csv.trim()) {
      return NextResponse.json({ error: "No CSV provided. Paste CSV later." }, { status: 400 });
    }
    const { rows, errors } = importRows(csv, csvRowSchema);
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
    recordImport({ businessId, filename, kind: "invoices", rowCount: imported.length });
    await saveSnapshot();
    return NextResponse.json({ imported: imported.length, errors, invoices: imported });
  }

  // Dashboard policy update
  if (path === "dashboard/policy") {
    const schema = z.object({
      minimumOverdueDays: z.coerce.number().int().min(0),
      maxReminders: z.coerce.number().int().min(1),
      cooldownDays: z.coerce.number().int().min(0),
      customerFollowUpDays: z.coerce.number().int().min(1),
      appointmentReminderHours: z.coerce.number().int().min(1),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const policy = setPolicy({ businessId, ...parsed.data });
    return NextResponse.json({ policy });
  }

  // Reminders generate
  if (path === "reminders/generate") {
    const result = await runInvoiceAgent(businessId);
    return NextResponse.json(result);
  }

  // Reminders approve/reject: reminders/:id/approve
  if (slug.length === 3 && slug[0] === "reminders" && slug[2] === "approve") {
    const draftId = slug[1];
    const draft = store.drafts.find((row) => row.id === draftId);
    if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });
    if (!draftInTenant(businessId, draft.recordId, draft.agent)) {
      return NextResponse.json({ error: "not in tenant" }, { status: 403 });
    }
    const decision = body?.decision === "rejected" ? "rejected" : "approved";
    draft.status = decision;
    addLog({
      agent: draft.agent,
      agentRunId: null,
      invoiceId: draft.recordId,
      action: decision === "approved" ? "approve_draft" : "reject_draft",
      result: `user ${decision} ${draft.id}`,
    });
    return NextResponse.json({ draft });
  }

  // Reminders send: reminders/:id/send
  if (slug.length === 3 && slug[0] === "reminders" && slug[2] === "send") {
    const draftId = slug[1];
    try {
      const tools = createTools(businessId);
      const result = await tools.execute_approved_draft(draftId);
      const draft = store.drafts.find((d) => d.id === draftId);
      addLog({
        agent: draft?.agent ?? "system",
        agentRunId: null,
        invoiceId: draft?.recordId ?? null,
        action: "execute_approved_draft",
        result: result.detail,
      });
      return NextResponse.json(result);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "send failed" }, { status: 400 });
    }
  }

  // Agent analyze
  const runners = {
    invoice: runInvoiceAgent,
    grant: runGrantAgent,
    customer: runCustomerAgent,
    compliance: runComplianceAgent,
    appointment: runAppointmentAgent,
  };

  if (path === "agent/analyze") {
    const kind = typeof body?.agent === "string" ? body.agent : "invoice";
    if (kind === "all") {
      return NextResponse.json(await runAllAgents(businessId));
    }
    const runner = runners[kind as keyof typeof runners] ?? runInvoiceAgent;
    return NextResponse.json(await runner(businessId));
  }

  if (slug.length === 3 && slug[0] === "agent" && slug[2] === "analyze") {
    const runner = runners[slug[1] as keyof typeof runners];
    if (!runner) return NextResponse.json({ error: "unknown agent" }, { status: 404 });
    return NextResponse.json(await runner(businessId));
  }

  // Workspace profile
  if (path === "workspace/profile") {
    const schema = z.object({
      name: z.string().min(1),
      industry: z.string(),
      employeeCount: z.coerce.number().int().min(0),
      annualRevenueSgd: z.coerce.number().min(0),
      isExporting: z.boolean(),
      usesDigitalTools: z.boolean(),
      hasGstRegistration: z.boolean(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const profile = setProfile({ businessId, ...parsed.data });
    await saveSnapshot();
    return NextResponse.json({ profile });
  }

  // Workspace customers
  if (path === "workspace/customers") {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      lastContactAt: z.string().optional().nullable(),
      notes: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const customer: FollowUpCustomer = {
      id: crypto.randomUUID(),
      businessId,
      name: parsed.data.name,
      email: parsed.data.email,
      lastContactAt: parsed.data.lastContactAt ? new Date(parsed.data.lastContactAt).toISOString() : null,
      notes: parsed.data.notes ?? "",
      followUpCount: 0,
    };
    store.customers.unshift(customer);
    addLog({ agent: "customer", agentRunId: null, invoiceId: customer.id, action: "create_customer", result: customer.email });
    return NextResponse.json({ customer });
  }

  if (path === "workspace/customers/import") {
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const filename = typeof body?.filename === "string" && body.filename.trim() ? body.filename.trim() : "customers.csv";
    if (!csv.trim()) return NextResponse.json({ error: "No CSV provided. Dataset deferred." }, { status: 400 });
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      last_contact_at: z.string().optional(),
      notes: z.string().optional(),
    });
    const { rows, errors } = importRows(csv, schema);
    const imported: FollowUpCustomer[] = rows.map((row) => {
      const customer: FollowUpCustomer = {
        id: crypto.randomUUID(),
        businessId,
        name: row.name,
        email: row.email,
        lastContactAt: row.last_contact_at ? new Date(row.last_contact_at).toISOString() : null,
        notes: row.notes ?? "",
        followUpCount: 0,
      };
      store.customers.unshift(customer);
      return customer;
    });
    recordImport({ businessId, filename, kind: "customers", rowCount: imported.length });
    await saveSnapshot();
    return NextResponse.json({ imported: imported.length, errors, customers: imported });
  }

  // Workspace compliance evidence: workspace/compliance/:id/evidence
  if (slug.length === 4 && slug[0] === "workspace" && slug[1] === "compliance" && slug[3] === "evidence") {
    const reqId = slug[2];
    const schema = z.object({
      status: z.enum(["missing", "submitted", "waived"]),
      note: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    let evidence = store.evidence.find((row) => row.businessId === businessId && row.requirementId === reqId);
    if (!evidence) {
      evidence = {
        id: crypto.randomUUID(),
        businessId,
        requirementId: reqId,
        status: parsed.data.status,
        note: parsed.data.note ?? "",
      };
      store.evidence.unshift(evidence);
    } else {
      evidence.status = parsed.data.status;
      evidence.note = parsed.data.note ?? evidence.note;
    }
    addLog({ agent: "compliance", agentRunId: null, invoiceId: reqId, action: "update_evidence", result: evidence.status });
    return NextResponse.json({ evidence });
  }

  // Workspace appointments
  if (path === "workspace/appointments") {
    const schema = z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      startsAt: z.string().min(8),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const appointment: Appointment = {
      id: crypto.randomUUID(),
      businessId,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      startsAt: new Date(parsed.data.startsAt).toISOString(),
      status: "booked",
      reminderCount: 0,
    };
    store.appointments.unshift(appointment);
    addLog({ agent: "appointment", agentRunId: null, invoiceId: appointment.id, action: "create_booking", result: appointment.customerEmail });
    return NextResponse.json({ appointment });
  }

  // Workspace appointments cancel: workspace/appointments/:id/cancel
  if (slug.length === 4 && slug[0] === "workspace" && slug[1] === "appointments" && slug[3] === "cancel") {
    const apptId = slug[2];
    const appointment = store.appointments.find((row) => row.id === apptId && row.businessId === businessId);
    if (!appointment) return NextResponse.json({ error: "booking not found" }, { status: 404 });
    appointment.status = "cancelled";
    addLog({ agent: "appointment", agentRunId: null, invoiceId: appointment.id, action: "cancel_booking", result: appointment.id });
    return NextResponse.json({ appointment });
  }

  // Workspace appointments import
  if (path === "workspace/appointments/import") {
    const csv = typeof body?.csv === "string" ? body.csv : "";
    const filename = typeof body?.filename === "string" && body.filename.trim() ? body.filename.trim() : "appointments.csv";
    if (!csv.trim()) return NextResponse.json({ error: "No CSV provided. Dataset deferred." }, { status: 400 });
    const schema = z.object({
      customer_name: z.string().min(1),
      customer_email: z.string().email(),
      starts_at: z.string().min(8),
      status: z.enum(["booked", "cancelled", "completed"]).default("booked"),
    });
    const { rows, errors } = importRows(csv, schema);
    const imported: Appointment[] = rows.map((row) => {
      const appointment: Appointment = {
        id: crypto.randomUUID(),
        businessId,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        startsAt: new Date(row.starts_at).toISOString(),
        status: (row.status ?? "booked") as Appointment["status"],
        reminderCount: 0,
      };
      store.appointments.unshift(appointment);
      return appointment;
    });
    recordImport({ businessId, filename, kind: "appointments", rowCount: imported.length });
    await saveSnapshot();
    return NextResponse.json({ imported: imported.length, errors, appointments: imported });
  }

  return NextResponse.json({ error: `Not found: /api/${path}` }, { status: 404 });
}
