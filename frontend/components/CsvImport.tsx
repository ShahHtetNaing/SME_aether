"use client";

import { useState } from "react";

export function CsvImport({
  title,
  hint,
  onImport,
}: {
  title: string;
  hint: string;
  onImport: (csv: string) => Promise<void>;
}) {
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");

  return (
    <section className="panel p-5">
      <h2 className="font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <textarea
        className="field mt-3 h-32"
        placeholder="Paste CSV here. Sample files are not bundled yet."
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
      />
      <button
        className="btn-ink mt-3"
        onClick={async () => {
          try {
            await onImport(csv);
            setCsv("");
            setMessage("Imported.");
          } catch (err) {
            setMessage(err instanceof Error ? err.message : "Import failed");
          }
        }}
      >
        Load file
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
}
