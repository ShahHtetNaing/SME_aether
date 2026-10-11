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
        description="This is the place to load business records. Paste CSV when the team has files. Until then, lists stay empty and you can still type single rows on each record page."
      />
      {message && <p className="text-sm text-red-800">{message}</p>}

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
