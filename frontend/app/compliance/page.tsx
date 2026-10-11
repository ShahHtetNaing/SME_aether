"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";

type Requirement = {
  id: string;
  framework: string;
  title: string;
  summary: string;
  applies: boolean;
  evidenceStatus: string;
};

export default function CompliancePage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setRequirements((await api.compliance()).requirements);
  }

  useEffect(() => {
    load().catch((err) => setMessage(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Compliance"
        description="A screening list for PDPA, ACRA, GST, CPF, and WSH. Not legal advice. Mark evidence when you have it."
        action={
          <button
            className="btn-primary"
            onClick={async () => {
              await api.analyze("compliance");
              setMessage("Gap notes are waiting in Approvals.");
              await load();
            }}
          >
            Review gaps
          </button>
        }
      />
      {message && <p className="text-sm">{message}</p>}
      <div className="space-y-3">
        {requirements.map((item) => (
          <article key={item.id} className="panel p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{item.framework}</p>
            <h2 className="mt-1 font-medium tracking-tight">{item.title}</h2>
            <p className="mt-2 text-sm">{item.summary}</p>
            <p className="mt-2 text-sm text-muted">
              {item.applies ? "Applies to current profile" : "Not flagged"} · evidence: {item.evidenceStatus}
            </p>
            <div className="mt-3 flex gap-2">
              {(["submitted", "waived", "missing"] as const).map((status) => (
                <button
                  key={status}
                  className="btn-ghost text-xs"
                  onClick={async () => {
                    await api.markEvidence(item.id, status);
                    await load();
                  }}
                >
                  Mark {status}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
