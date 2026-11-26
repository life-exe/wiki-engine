import { useState, type ComponentProps, type ReactElement, type ReactNode } from "react";

function toSlug(node: ReactNode): string {
  const text = (function extract(n: ReactNode): string {
    if (typeof n === "string") return n;
    if (Array.isArray(n)) return n.map(extract).join("");
    if (n && typeof n === "object" && "props" in (n as object))
      return extract((n as ReactElement<{ children?: ReactNode }>).props.children);
    return "";
  })(node);
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function Heading({
  level,
  children,
  ...props
}: ComponentProps<"h1"> & { level: 1 | 2 | 3 | 4 }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  const id = toSlug(children);
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentId = e.currentTarget.parentElement?.id || id;
    const url = `${window.location.origin}${window.location.pathname}#${currentId}`;
    void navigator.clipboard.writeText(url).then(() => {
      window.history.replaceState(null, "", `#${currentId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <Tag id={id} className="group scroll-mt-6" {...props}>
      {children}
      <a
        href={`#${id}`}
        onClick={onCopy}
        data-toc-ignore="true"
        aria-label="Copy link to this heading"
        className="ml-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-muted-foreground no-underline transition-opacity"
      >
        {copied ? "✓" : "#"}
      </a>
    </Tag>
  );
}
