import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#1e3a5f",
    primaryTextColor: "#e2e8f0",
    primaryBorderColor: "#3b82f6",
    lineColor: "#64748b",
    secondaryColor: "#1a2744",
    tertiaryColor: "#0f172a",
    background: "#0d1117",
    mainBkg: "#1e293b",
    nodeBorder: "#3b82f6",
    clusterBkg: "#1e293b",
    titleColor: "#94a3b8",
    edgeLabelBackground: "#1e293b",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "14px",
  },
});

let idCounter = 0;

export function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    mermaid
      .render(id.current, code)
      .then(({ svg }) => {
        setSvg(svg);
        setError("");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [code]);

  if (error) {
    return (
      <pre className="text-red-400 text-xs p-4 bg-red-950/20 rounded border border-red-800">
        Mermaid error: {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      className="my-6 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
