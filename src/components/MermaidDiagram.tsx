import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

const FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const DARK_THEME_VARS = {
  darkMode: true,
  background: "#09090b",
  primaryColor: "#172554",
  primaryTextColor: "#f4f4f5",
  primaryBorderColor: "#3b82f6",
  secondaryColor: "#18181b",
  secondaryTextColor: "#e4e4e7",
  secondaryBorderColor: "#3f3f46",
  tertiaryColor: "#111827",
  tertiaryTextColor: "#e4e4e7",
  tertiaryBorderColor: "#27272a",
  lineColor: "#71717a",
  textColor: "#e4e4e7",
  mainBkg: "#18181b",
  nodeBorder: "#3b82f6",
  clusterBkg: "#18181b",
  clusterBorder: "#3f3f46",
  titleColor: "#f4f4f5",
  edgeLabelBackground: "#18181b",
  actorBkg: "#18181b",
  actorBorder: "#3b82f6",
  actorTextColor: "#f4f4f5",
  actorLineColor: "#52525b",
  signalColor: "#a1a1aa",
  signalTextColor: "#e4e4e7",
  labelBoxBkgColor: "#18181b",
  labelBoxBorderColor: "#3f3f46",
  labelTextColor: "#e4e4e7",
  noteBkgColor: "#1e293b",
  noteBorderColor: "#3b82f6",
  noteTextColor: "#e4e4e7",
  fontFamily: FONT_FAMILY,
  fontSize: "14px",
};

const LIGHT_THEME_VARS = {
  darkMode: false,
  background: "#ffffff",
  primaryColor: "#eff6ff",
  primaryTextColor: "#18181b",
  primaryBorderColor: "#2563eb",
  secondaryColor: "#f4f4f5",
  secondaryTextColor: "#18181b",
  secondaryBorderColor: "#d4d4d8",
  tertiaryColor: "#fafafa",
  tertiaryTextColor: "#18181b",
  tertiaryBorderColor: "#e4e4e7",
  lineColor: "#71717a",
  textColor: "#18181b",
  mainBkg: "#f8fafc",
  nodeBorder: "#2563eb",
  clusterBkg: "#f4f4f5",
  clusterBorder: "#d4d4d8",
  titleColor: "#18181b",
  edgeLabelBackground: "#ffffff",
  actorBkg: "#eff6ff",
  actorBorder: "#2563eb",
  actorTextColor: "#18181b",
  actorLineColor: "#a1a1aa",
  signalColor: "#52525b",
  signalTextColor: "#18181b",
  labelBoxBkgColor: "#f4f4f5",
  labelBoxBorderColor: "#d4d4d8",
  labelTextColor: "#18181b",
  noteBkgColor: "#eff6ff",
  noteBorderColor: "#2563eb",
  noteTextColor: "#18181b",
  fontFamily: FONT_FAMILY,
  fontSize: "14px",
};

const THEME_CSS = `
  .node rect, .node polygon { rx: 8px; ry: 8px; stroke-width: 1.25px; }
  .cluster rect { rx: 10px; ry: 10px; stroke-width: 1px; }
  .edgePath .path { stroke-width: 1.5px; }
  .edgeLabel { font-size: 12px; }
`;

function initMermaid(isDark: boolean) {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: isDark ? DARK_THEME_VARS : LIGHT_THEME_VARS,
    themeCSS: THEME_CSS,
    flowchart: {
      curve: "basis",
      padding: 16,
      nodeSpacing: 45,
      rankSpacing: 55,
      htmlLabels: true,
    },
  });
}

function getIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

let idCounter = 0;

export function MermaidDiagram({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDark, setIsDark] = useState<boolean>(getIsDark);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${++idCounter}`;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.visibility = "hidden";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    initMermaid(isDark);

    mermaid
      .render(id, code, container)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError("");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      })
      .finally(() => {
        container.remove();
      });

    return () => {
      cancelled = true;
      container.remove();
    };
  }, [code, isDark]);

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
