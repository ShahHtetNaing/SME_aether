import { Router } from "express";
import type { TenantRequest } from "../middleware/tenant.js";
import { getPolicy, getProfile, getStore, setPolicy } from "../services/store.js";
import { isEligible } from "../services/overdue.js";
import { GRANT_CATALOG } from "../../../agents/catalogs/grants.js";
import { COMPLIANCE_CATALOG } from "../../../agents/catalogs/compliance.js";
import { z } from "zod";

const router = Router();

router.get("/stats", (req, res) => {
  const { businessId } = req as TenantRequest;
  const store = getStore();
  const policy = getPolicy(businessId);
  const profile = getProfile(businessId);
  const invoices = store.invoices.filter((invoice) => invoice.businessId === businessId);
  const overdue = invoices.filter((invoice) => isEligible(invoice, policy).ok);
  const customers = store.customers.filter((row) => row.businessId === businessId);
  const appointments = store.appointments.filter((row) => row.businessId === businessId);
  const grantMatches = GRANT_CATALOG.filter((grant) => grant.match(profile).ok);
  const complianceGaps = COMPLIANCE_CATALOG.filter((item) => item.appliesWhen(profile)).length;
  const drafts = store.drafts.filter((draft) => draft.status === "pending" || draft.status === "approved");

  res.json({
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
});

router.get("/policy", (req, res) => {
  const { businessId } = req as TenantRequest;
  res.json({ policy: getPolicy(businessId) });
});

router.post("/policy", (req, res) => {
  const { businessId } = req as TenantRequest;
  const schema = z.object({
    minimumOverdueDays: z.coerce.number().int().min(0),
    maxReminders: z.coerce.number().int().min(1),
    cooldownDays: z.coerce.number().int().min(0),
    customerFollowUpDays: z.coerce.number().int().min(1),
    appointmentReminderHours: z.coerce.number().int().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const policy = setPolicy({ businessId, ...parsed.data });
  res.json({ policy });
});

export default router;
