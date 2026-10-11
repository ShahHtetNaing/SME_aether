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
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(text: string) {
    if (!text.trim()) {
      setMessage("Paste CSV or drop a file first.");
      return;
    }
    setBusy(true);
    try {
      await onImport(text);
      setCsv("");
      setMessage("Imported. Agents started — open Approvals.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function fromFiles(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setCsv(await file.text());
  }

  return (
    <section
      className={`panel drop-zone p-5 ${active ? "active" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setActive(false);
        await fromFiles(event.dataTransfer.files);
      }}
    >
      <h2 className="font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <textarea
        className="field mt-3 h-32"
        placeholder="Drop a CSV file here, or paste the rows."
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        onPaste={(event) => {
          const text = event.clipboardData.getData("text");
          if (text.trim()) setCsv(text);
        }}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="btn-ghost cursor-pointer px-4 py-2 text-sm">
          Choose file
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={async (event) => {
              if (event.target.files) await fromFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        <button className="btn-ink" disabled={busy} onClick={() => submit(csv)}>
          {busy ? "Importing…" : "Import and run agents"}
        </button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </section>
  );
}
