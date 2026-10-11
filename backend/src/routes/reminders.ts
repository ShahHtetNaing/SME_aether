import { Router } from "express";
import type { TenantRequest } from "../middleware/tenant.js";
import { addLog, getStore } from "../services/store.js";
import { createTools } from "../../../agents/tools/index.js";
import { runAllAgents, runInvoiceAgent } from "../../../agents/runners/run.js";
import type { AgentKind } from "../types.js";

const router = Router();

function draftInTenant(businessId: string, recordId: string, agent: AgentKind) {
  const store = getStore();
  if (agent === "invoice") return store.invoices.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "customer") return store.customers.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "appointment") return store.appointments.some((row) => row.id === recordId && row.businessId === businessId);
  if (agent === "grant" || agent === "compliance") return true;
  return false;
}

router.post("/generate", async (req, res) => {
  const { businessId } = req as TenantRequest;
  const result = await runInvoiceAgent(businessId);
  res.json(result);
});

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

router.get("/pending", async (req, res) => {
  const { businessId } = req as TenantRequest;
  let drafts = listPending(businessId);
  if (drafts.length === 0) {
    await runAllAgents(businessId);
    drafts = listPending(businessId);
  }
  res.json({ drafts });
});

router.post("/:id/approve", (req, res) => {
  const { businessId, actorId } = req as TenantRequest;
  const store = getStore();
  const draft = store.drafts.find((row) => row.id === req.params.id);
  if (!draft) return res.status(404).json({ error: "draft not found" });
  if (!draftInTenant(businessId, draft.recordId, draft.agent)) return res.status(403).json({ error: "not in tenant" });
  const decision = req.body?.decision === "rejected" ? "rejected" : "approved";
  draft.status = decision;
  addLog({
    agent: draft.agent,
    agentRunId: null,
    invoiceId: draft.recordId,
    action: decision === "approved" ? "approve_draft" : "reject_draft",
    result: `${actorId} ${decision} ${draft.id}`,
  });
  res.json({ draft });
});

router.post("/:id/send", async (req, res) => {
  const { businessId } = req as TenantRequest;
  try {
    const tools = createTools(businessId);
    const result = await tools.execute_approved_draft(req.params.id);
    const draft = getStore().drafts.find((d) => d.id === req.params.id);
    addLog({
      agent: draft?.agent ?? "system",
      agentRunId: null,
      invoiceId: draft?.recordId ?? null,
      action: "execute_approved_draft",
      result: result.detail,
    });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "send failed" });
  }
});

export default router;
