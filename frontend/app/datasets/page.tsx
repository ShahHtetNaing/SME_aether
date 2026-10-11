"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { CsvImport } from "../../components/CsvImport";
import { PageHeader } from "../../components/PageHeader";
import type { Stats } from "../../lib/types";

export default function DatasetsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setStats(await api.stats());
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Workspace"
        title="Datasets"
        description="Load the built-in sample on this page, or paste your own CSV below."
      />
      {message && <p className="text-sm text-red-800">{message}</p>}

      <section className="panel p-5">
        <h2 className="font-medium tracking-tight">Sample dataset</h2>
        <p className="mt-1 text-sm text-muted">
          Loads Harbour Digital Studio on this page: 6 invoices, 6 customers, 5 bookings, and the Settings profile.
        </p>
        <button
          className="btn-ink mt-4"
          onClick={async () => {
            try {
              const result = await api.loadDemo();
              await load();
              setMessage(
                `Loaded ${result.totals.invoices} invoices, ${result.totals.customers} customers, ${result.totals.appointments} bookings.`,
              );
            } catch (err) {
              setMessage(err instanceof Error ? err.message : "Could not load sample");
            }
          }}
        >
          Load sample on this page
        </button>
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
          onImport={async (csv) => {
            await api.importCsv(csv);
            await load();
          }}
        />
        <CsvImport
          title="Customers"
          hint="name, email, last_contact_at, notes"
          onImport={async (csv) => {
            await api.importCustomers(csv);
            await load();
          }}
        />
        <CsvImport
          title="Bookings"
          hint="customer_name, customer_email, starts_at, status (booked | cancelled | completed)"
          onImport={async (csv) => {
            await api.importAppointments(csv);
            await load();
          }}
        />
      </div>
    </div>
  );
}
