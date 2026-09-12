import type { ReactNode } from "react";
import { useWiki } from "../context/WikiContext";

/** Normalizes `BookOpen`, `book_open`, `Book Open` and `book-open` to `book-open`. */
export function normalizeIconName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Resolves a page's `icon:` frontmatter value against `config.icons`.
 * Lookup is case-insensitive and dash/underscore agnostic.
 * A value that is not registered is rendered as-is, which covers emoji (`icon: 🤍`).
 */
export function resolveIcon(
  name: string | undefined,
  icons: Record<string, ReactNode> | undefined,
): ReactNode {
  if (!name) return null;
  const raw = name.trim();
  if (!raw) return null;
  if (icons) {
    const direct = icons[raw];
    if (direct !== undefined) return direct;
    const normalized = normalizeIconName(raw);
    for (const key of Object.keys(icons)) {
      if (normalizeIconName(key) === normalized) return icons[key];
    }
  }
  return raw;
}

/** Renders the icon requested by a page's `icon:` frontmatter, if any. */
export function WikiIcon({ name, className = "" }: { name?: string; className?: string }) {
  const { config } = useWiki();
  const icon = resolveIcon(name, config.icons);
  if (icon === null || icon === undefined || icon === "") return null;
  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`} aria-hidden="true">
      {icon}
    </span>
  );
}
