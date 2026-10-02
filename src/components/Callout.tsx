import React, { Fragment, isValidElement, type ReactNode, type ComponentProps } from "react";
import { Info, Lightbulb, AlertCircle, AlertTriangle, OctagonAlert } from "lucide-react";
import { MarkdownLink } from "./MarkdownLink";
import { useLang } from "../context/LangContext";

function parseInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <MarkdownLink key={match.index} href={linkMatch[2]}>
            {linkMatch[1]}
          </MarkdownLink>,
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

export function processCalloutChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return parseInlineMarkdown(children);
  }
  if (Array.isArray(children)) {
    return children.map((c, i) => (
      <Fragment key={i}>{processCalloutChildren(c)}</Fragment>
    ));
  }
  if (children && typeof children === "object" && "props" in (children as any)) {
    const el = children as React.ReactElement<any>;
    if (el.props && el.props.children) {
      return React.cloneElement(el, {
        children: processCalloutChildren(el.props.children),
      });
    }
  }
  return children;
}

export type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

const ALERT_CONFIG = {
  NOTE: {
    titleRu: "Примечание",
    titleEn: "Note",
    Icon: Info,
    border: "border-blue-500",
    headerText: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
  },
  TIP: {
    titleRu: "Совет",
    titleEn: "Tip",
    Icon: Lightbulb,
    border: "border-emerald-500",
    headerText: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  IMPORTANT: {
    titleRu: "Важно",
    titleEn: "Important",
    Icon: AlertCircle,
    border: "border-purple-500",
    headerText: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
  },
  WARNING: {
    titleRu: "Внимание",
    titleEn: "Warning",
    Icon: AlertTriangle,
    border: "border-amber-500",
    headerText: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
  },
  CAUTION: {
    titleRu: "Осторожно",
    titleEn: "Caution",
    Icon: OctagonAlert,
    border: "border-rose-500",
    headerText: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
  },
} as const;

function extractAlert(children: ReactNode): { type: AlertType; content: ReactNode } | null {
  const childArray = React.Children.toArray(children);
  const firstChildIndex = childArray.findIndex(
    (c) => !(typeof c === "string" && c.trim() === ""),
  );
  if (firstChildIndex === -1) return null;

  const firstChild = childArray[firstChildIndex];

  if (typeof firstChild === "string") {
    const match = firstChild.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\r?\n|[ \t]+|$)/i);
    if (!match) return null;
    const alertType = match[1].toUpperCase() as AlertType;
    const stripped = firstChild.slice(match[0].length);
    const content = (
      <>
        {stripped ? stripped : null}
        {childArray.slice(firstChildIndex + 1)}
      </>
    );
    return { type: alertType, content };
  }

  if (!isValidElement(firstChild)) return null;

  const pProps = firstChild.props as { children?: ReactNode };
  const pChildren = React.Children.toArray(pProps?.children);
  if (pChildren.length === 0) return null;

  const firstPChildIndex = pChildren.findIndex(
    (c) => !(typeof c === "string" && c.trim() === ""),
  );
  if (firstPChildIndex === -1) return null;

  const firstPChild = pChildren[firstPChildIndex];
  if (typeof firstPChild !== "string") return null;

  const match = firstPChild.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\r?\n|[ \t]+|$)/i);
  if (!match) return null;

  const alertType = match[1].toUpperCase() as AlertType;
  const strippedFirst = firstPChild.slice(match[0].length);

  const newPChildren = [
    ...pChildren.slice(0, firstPChildIndex),
    ...(strippedFirst ? [strippedFirst] : []),
    ...pChildren.slice(firstPChildIndex + 1),
  ];

  const newFirstChild = React.cloneElement(firstChild, {
    ...(firstChild.props as Record<string, unknown>),
    children: newPChildren.length > 0 ? newPChildren : null,
  } as any);

  const content = (
    <>
      {childArray.slice(0, firstChildIndex)}
      {newPChildren.length > 0 ? newFirstChild : null}
      {childArray.slice(firstChildIndex + 1)}
    </>
  );

  return { type: alertType, content };
}

export function MarkdownBlockquote({ children, ...props }: ComponentProps<"blockquote">) {
  const lang = useLang();
  const alert = extractAlert(children);

  if (!alert) {
    return <blockquote {...props}>{children}</blockquote>;
  }

  const config = ALERT_CONFIG[alert.type];
  const IconComponent = config.Icon;
  const title = lang === "en" ? config.titleEn : config.titleRu;

  return (
    <div
      className={`my-4 rounded-r-lg border-l-4 ${config.border} ${config.bg} px-4 py-3 text-foreground`}
      role="alert"
    >
      <div className={`flex items-center gap-2 font-semibold text-sm mb-1.5 ${config.headerText}`}>
        <IconComponent size={16} className="shrink-0" />
        <span>{title}</span>
      </div>
      <div className="text-sm leading-relaxed [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>p]:my-1.5">
        {alert.content}
      </div>
    </div>
  );
}
