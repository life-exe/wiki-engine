import { useState, Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Copy, Check } from "lucide-react";
import { MermaidDiagram } from "./MermaidDiagram";

type PreProps = React.ComponentPropsWithoutRef<"pre"> & { node?: unknown };

const getText = (node: ReactNode): string => {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(getText).join("");
  if (isValidElement(node))
    return getText((node as ReactElement<{ children?: ReactNode }>).props.children);
  return "";
};

export function CodeBlockPre({ children }: PreProps) {
  const [copied, setCopied] = useState(false);

  const codeEl = (
    isValidElement(children) ? children : Children.toArray(children).find((c) => isValidElement(c))
  ) as ReactElement<{ className?: string; children?: ReactNode }> | undefined;

  const langMatch = (codeEl?.props?.className ?? "").match(/language-(\w+)/);
  const lang = langMatch ? langMatch[1] : null;

  if (lang === "mermaid") {
    const code = getText(codeEl?.props?.children ?? "").trim();
    return <MermaidDiagram code={code} />;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(getText(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-7 border-l-2 border-blue-500 bg-[#0d1117]">
      <div className="flex items-center justify-between bg-[#0d1117] px-4 py-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
          {lang ?? "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors cursor-pointer"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre
        className="article-code-block overflow-x-auto text-[17px] leading-6 font-mono"
        style={{ margin: 0, padding: "1rem 1.25rem" }}
      >
        {children}
      </pre>
    </div>
  );
}
