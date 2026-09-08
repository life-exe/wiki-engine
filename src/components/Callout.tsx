import React, { Fragment, type ReactNode } from "react";

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
          <a key={match.index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>,
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
