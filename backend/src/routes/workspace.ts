import { Router } from "express";
import { z } from "zod";
import type { TenantRequest } from "../middleware/tenant.js";
import { addLog, getProfile, getStore, setProfile } from "../services/store.js";
import { importRows } from "../services/csv.js";
import { GRANT_CATALOG } from "../../../agents/catalogs/grants.js";
import { COMPLIANCE_CATALOG } from "../../../agents/catalogs/compliance.js";
import type { Appointment, FollowUpCustomer } from "../types.js";

const router = Router();

router.get("/profile", (req, res) => {
  const { businessId } = req as TenantRequest;
  res.json({ profile: getProfile(businessId) });
});

router.post("/profile", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    name: z.string().min(1),
    industry: z.string(),
    employeeCount: z.coerce.number().int().min(0),
    annualRevenueSgd: z.coerce.number().min(0),
    isExporting: z.boolean(),
    usesDigitalTools: z.boolean(),
    hasGstRegistration: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  res.json({ profile: setProfile({ businessId, ...parsed.data }) });
});

router.get("/grants", (req, res) => {
  const { businessId } = req as TenantRequest;
  const profile = getProfile(businessId);
  const grants = GRANT_CATALOG.map((grant) => ({
    id: grant.id,
    name: grant.name,
    agency: grant.agency,
    summary: grant.summary,
    checklist: grant.checklist,
    match: grant.match(profile),
  }));
  res.json({ grants, profileReady: Boolean(profile.industry) });
});

router.get("/customers", (req, res) => {
  const { businessId } = req as TenantRequest;
  res.json({ customers: getStore().customers.filter((row) => row.businessId === businessId) });
});

router.post("/customers", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    lastContactAt: z.string().optional().nullable(),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const customer: FollowUpCustomer = {
    id: crypto.randomUUID(),
    businessId,
    name: parsed.data.name,
    email: parsed.data.email,
    lastContactAt: parsed.data.lastContactAt ? new Date(parsed.data.lastContactAt).toISOString() : null,
    notes: parsed.data.notes ?? "",
    followUpCount: 0,
  };
  getStore().customers.unshift(customer);
  addLog({ agent: "customer", agentRunId: null, invoiceId: customer.id, action: "create_customer", result: customer.email });
  res.json({ customer });
});

router.post("/customers/import", (req, res) => {
  const { businessId } = req as TenantRequest;
  const csv = typeof req.body?.csv === "string" ? req.body.csv : "";
  if (!csv.trim()) return res.status(400).json({ error: "No CSV provided. Dataset deferred." });
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
    getStore().customers.unshift(customer);
    return customer;
  });
  res.json({ imported: imported.length, errors, customers: imported });
});

router.get("/compliance", (req, res) => {
  const { businessId } = req as TenantRequest;
  const profile = getProfile(businessId);
  const store = getStore();
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
  res.json({ requirements });
});

router.post("/compliance/:id/evidence", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    status: z.enum(["missing", "submitted", "waived"]),
    note: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const store = getStore();
  let evidence = store.evidence.find((row) => row.businessId === businessId && row.requirementId === req.params.id);
  if (!evidence) {
    evidence = {
      id: crypto.randomUUID(),
      businessId,
      requirementId: req.params.id,
      status: parsed.data.status,
      note: parsed.data.note ?? "",
    };
    store.evidence.unshift(evidence);
  } else {
    evidence.status = parsed.data.status;
    evidence.note = parsed.data.note ?? evidence.note;
  }
  addLog({ agent: "compliance", agentRunId: null, invoiceId: req.params.id, action: "update_evidence", result: evidence.status });
  res.json({ evidence });
});

router.get("/appointments", (req, res) => {
  const { businessId } = req as TenantRequest;
  res.json({ appointments: getStore().appointments.filter((row) => row.businessId === businessId) });
});

router.post("/appointments", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    startsAt: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const appointment: Appointment = {
    id: crypto.randomUUID(),
    businessId,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    startsAt: new Date(parsed.data.startsAt).toISOString(),
    status: "booked",
    reminderCount: 0,
  };
  getStore().appointments.unshift(appointment);
  addLog({ agent: "appointment", agentRunId: null, invoiceId: appointment.id, action: "create_booking", result: appointment.customerEmail });
  res.json({ appointment });
});

router.post("/appointments/:id/cancel", (req, res) => {
  const { businessId } = req as TenantRequest;
  const appointment = getStore().appointments.find((row) => row.id === req.params.id && row.businessId === businessId);
  if (!appointment) return res.status(404).json({ error: "booking not found" });
  appointment.status = "cancelled";
  addLog({ agent: "appointment", agentRunId: null, invoiceId: appointment.id, action: "cancel_booking", result: appointment.id });
  res.json({ appointment });
});

router.post("/appointments/import", (req, res) => {
  const { businessId } = req as TenantRequest;
  const csv = typeof req.body?.csv === "string" ? req.body.csv : "";
  if (!csv.trim()) return res.status(400).json({ error: "No CSV provided. Dataset deferred." });
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
      status: row.status,
      reminderCount: 0,
    };
    getStore().appointments.unshift(appointment);
    return appointment;
  });
  res.json({ imported: imported.length, errors, appointments: imported });
});

export default router;
