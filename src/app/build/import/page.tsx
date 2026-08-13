"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type RowError = { row: number; message: string };

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [imported, setImported] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setRowErrors([]);
    setImported(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        if (Array.isArray(data.rowErrors)) setRowErrors(data.rowErrors);
        return;
      }

      setImported(data.imported);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFileName(null);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/build" className="text-sm text-foreground/60 hover:underline">
        &larr; Back
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Import your own questions</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Upload an Excel (.xlsx, .xls) or CSV file. Each row becomes a question in your list.
      </p>

      <div className="mt-6 rounded-lg border border-black/10 p-4 text-sm dark:border-white/10">
        <p className="font-medium">Columns</p>
        <p className="mt-1 text-foreground/60">
          Required: <span className="font-mono">Topic</span>, <span className="font-mono">Question</span>,{" "}
          <span className="font-mono">Answer</span>.
        </p>
        <p className="mt-1 text-foreground/60">
          Optional: <span className="font-mono">Sub Topic</span>,{" "}
          <span className="font-mono">Difficulty Level</span> (Easy/Medium/Hard),{" "}
          <span className="font-mono">Target Roles</span> (comma-separated),{" "}
          <span className="font-mono">Chance Of Being Asked</span> (VeryHigh/High/Medium/Low/VeryLow),{" "}
          <span className="font-mono">User Answer Confidence</span> (0-5),{" "}
          <span className="font-mono">Answer Visibility</span> and{" "}
          <span className="font-mono">Question Visibility</span> (Public/Private).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
        />

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {rowErrors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/20">
            <p className="font-medium text-red-700 dark:text-red-400">
              Fix these {rowErrors.length} issue{rowErrors.length === 1 ? "" : "s"} and re-upload — no rows were
              saved.
            </p>
            <ul className="mt-2 max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-red-700 dark:text-red-400">
              {rowErrors.map((re, i) => (
                <li key={i}>
                  {re.row > 0 ? `Row ${re.row}: ` : ""}
                  {re.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {imported !== null && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-400">
            Imported {imported} question{imported === 1 ? "" : "s"} into your list.{" "}
            <Link href="/questions" className="font-medium underline">
              View them
            </Link>
            .
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !fileName}
          className="mt-2 self-start rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? "Importing…" : "Import"}
        </button>
      </form>
    </div>
  );
}
