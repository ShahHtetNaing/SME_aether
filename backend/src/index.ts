import cors from "cors";
import express from "express";
import { tenantContext } from "./middleware/tenant.js";
import invoiceRoutes from "./routes/invoices.js";
import reminderRoutes from "./routes/reminders.js";
import agentRoutes from "./routes/agent.js";
import dashboardRoutes from "./routes/dashboard.js";
import workspaceRoutes from "./routes/workspace.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({ origin: origins }));
app.use(express.json({ limit: "2mb" }));
app.use(tenantContext);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "smeflow-ai", dataset: "deferred" });
});

app.use("/api/invoices", invoiceRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/workspace", workspaceRoutes);

app.listen(port, () => {
  console.log(`Aether API listening on http://localhost:${port}`);
});
