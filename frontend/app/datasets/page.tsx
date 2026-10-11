"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { classifyCsv, type DatasetKind } from "../../lib/dataset";
import { CsvImport } from "../../components/CsvImport";
import { PageHeader } from "../../components/PageHeader";
import type { Stats } from "../../lib/types";

export default function DatasetsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    setStats(await api.stats());
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  async function importKind(kind: DatasetKind, csv: string) {
    if (kind === "invoices") await api.importCsv(csv);
    if (kind === "customers") await api.importCustomers(csv);
    if (kind === "appointments") await api.importAppointments(csv);
  }

  async function importThenRun(kind: DatasetKind, csv: string) {
    await importKind(kind, csv);
    await api.analyze("all");
    await load();
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((file) => file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain");
    if (!list.length) {
      setMessage("Drop CSV files (invoices, customers, bookings).");
      return;
    }
    setBusy(true);
    try {
      const loaded: string[] = [];
      for (const file of list) {
        const csv = await file.text();
        const kind = classifyCsv(csv, file.name);
        if (!kind) {
          setMessage(`Could not tell what ${file.name} is. Name it invoices.csv, customers.csv, or appointments.csv.`);
          return;
        }
        await importKind(kind, csv);
        loaded.push(`${file.name} → ${kind}`);
      }
      await api.analyze("all");
      await load();
      setMessage(`${loaded.join(" · ")}. Agents started — open Approvals.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Datasets"
        description="Drag CSV files onto this page, or paste into a box. After import, all five agents run and drafts go to Approvals."
      />
      {message && <p className="text-sm text-red-800">{message}</p>}

      <section
        className={`panel drop-zone p-8 text-center ${active ? "active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setActive(true);
        }}
        onDragLeave={() => setActive(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setActive(false);
          await handleFiles(event.dataTransfer.files);
        }}
        onPaste={async (event) => {
          const text = event.clipboardData.getData("text");
          if (!text.trim()) return;
          const kind = classifyCsv(text);
          if (!kind) {
            setMessage("Paste could not be classified. Use an invoices, customers, or bookings header row.");
            return;
          }
          setBusy(true);
          try {
            await importThenRun(kind, text);
            setMessage(`Pasted ${kind}. Agents started — open Approvals.`);
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Import failed");
          } finally {
            setBusy(false);
          }
        }}
        tabIndex={0}
      >
        <p className="text-lg font-semibold tracking-tight">Drop CSV files here</p>
        <p className="mt-2 text-sm text-muted">
          You can drop invoices.csv, customers.csv, and appointments.csv together. Or click and paste.
        </p>
        <label className="btn-ink mt-5 inline-block cursor-pointer">
          {busy ? "Importing…" : "Choose files"}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            multiple
            className="hidden"
            disabled={busy}
            onChange={async (event) => {
              if (event.target.files) await handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Invoices", stats?.totals.invoices ?? 0],
          ["Customers", stats?.totals.customers ?? 0],
          ["Bookings", stats?.totals.appointments ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="panel p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-1">
        <CsvImport
          title="Invoices"
          hint="invoice_number, customer_name, customer_email, amount_sgd, due_date, status (unpaid | paid | disputed)"
          onImport={(csv) => importThenRun("invoices", csv)}
        />
        <CsvImport
          title="Customers"
          hint="name, email, last_contact_at, notes"
          onImport={(csv) => importThenRun("customers", csv)}
        />
        <CsvImport
          title="Bookings"
          hint="customer_name, customer_email, starts_at, status (booked | cancelled | completed)"
          onImport={(csv) => importThenRun("appointments", csv)}
        />
      </div>
    </div>
  );
}
