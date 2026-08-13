"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

export function MermaidDiagram({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    mermaid
      .render(`mermaid-${id}`, chart)
      .then((result) => {
        if (!cancelled) {
          setError(null);
          setSvg(result.svg);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSvg(null);
          setError(err instanceof Error ? err.message : "Failed to render diagram");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-600 dark:text-red-400">
        {`Failed to render diagram: ${error}\n\n${chart}`}
      </pre>
    );
  }

  if (!svg) {
    return <div className="my-2 text-xs text-foreground/40">Rendering diagram…</div>;
  }

  return <div className="my-2 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
