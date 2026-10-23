import type { WikiCategoryConfig } from "../../types";

export const getItemActiveStyles = (depth: number) =>
  `bg-accent text-foreground font-medium border-l-2 border-primary ${
    depth === 0 ? "rounded-md" : "-ml-px rounded-r-md rounded-l-none"
  }`;

export const getItemInactiveStyles = (depth: number) =>
  `border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/80 ${
    depth === 0 ? "rounded-md" : "-ml-px rounded-r-md rounded-l-none"
  }`;

export const getCardActiveStyles = () =>
  "bg-accent/90 text-foreground font-semibold border-l-2 border-primary rounded-lg shadow-xs";

export const getCardInactiveStyles = () =>
  "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/70 rounded-lg";

export function resolveCoverUrl(
  coverRaw: string | undefined,
  sectionSlug: string,
  wikiImages: Record<string, string> = {},
): string | undefined {
  if (!coverRaw) return undefined;
  if (
    coverRaw.startsWith("http://") ||
    coverRaw.startsWith("https://") ||
    coverRaw.startsWith("/")
  ) {
    return coverRaw;
  }
  const cleanCover = coverRaw.replace(/^\.\//, "");
  const found =
    Object.keys(wikiImages).find((p) => p.endsWith(`/${sectionSlug}/${cleanCover}`)) ??
    Object.keys(wikiImages).find((p) => p.endsWith(`/${cleanCover}`)) ??
    Object.keys(wikiImages).find((p) => p.toLowerCase().includes(cleanCover.toLowerCase()));
  return found ? wikiImages[found] : coverRaw;
}

export function resolveCategoryLabel(cat: WikiCategoryConfig, lang: string): string {
  if (typeof cat.label === "string") return cat.label;
  if (typeof cat.label === "object" && cat.label !== null) {
    return cat.label[lang] ?? cat.label["ru"] ?? cat.label["en"] ?? "";
  }
  return "";
}
