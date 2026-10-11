import { Router } from "express";
import type { TenantRequest } from "../middleware/tenant.js";
import { getStore } from "../services/store.js";
import {
  runAllAgents,
  runAppointmentAgent,
  runComplianceAgent,
  runCustomerAgent,
  runGrantAgent,
  runInvoiceAgent,
} from "../../../agents/runners/run.js";

const router = Router();

const runners = {
  invoice: runInvoiceAgent,
  grant: runGrantAgent,
  customer: runCustomerAgent,
  compliance: runComplianceAgent,
  appointment: runAppointmentAgent,
};

router.post("/analyze", async (req, res) => {
  const { businessId } = req as TenantRequest;
  const kind = typeof req.body?.agent === "string" ? req.body.agent : "invoice";
  if (kind === "all") {
    res.json(await runAllAgents(businessId));
    return;
  }
  const runner = runners[kind as keyof typeof runners] ?? runInvoiceAgent;
  res.json(await runner(businessId));
});

router.post("/:kind/analyze", async (req, res) => {
  const { businessId } = req as TenantRequest;
  const runner = runners[req.params.kind as keyof typeof runners];
  if (!runner) return res.status(404).json({ error: "unknown agent" });
  res.json(await runner(businessId));
});

router.get("/activity", (req, res) => {
  const { businessId } = req as TenantRequest;
  const store = getStore();
  res.json({
    logs: store.logs.filter((log) => store.runs.some((run) => run.id === log.agentRunId && run.businessId === businessId) || log.agentRunId === null),
    runs: store.runs.filter((run) => run.businessId === businessId),
  });
});

export default router;
