/**
 * Utility functions for wiki routing and path normalization.
 */

/**
 * Normalizes a base route path.
 *
 * Examples:
 * - undefined | "" | "/" -> ""
 * - "wiki" | "/wiki" | "/wiki/" -> "/wiki"
 * - "docs/wiki" -> "/docs/wiki"
 */
export function normalizeBasePath(basePath?: string): string {
  if (!basePath) return "";
  const trimmed = basePath.trim().replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}` : "";
}

/**
 * Builds a full route path considering the configured basePath prefix.
 *
 * Examples with basePath = "":
 * - getWikiPath("", "community") -> "/community"
 * - getWikiPath("", "/community") -> "/community"
 * - getWikiPath("", "courses/ue-pro") -> "/courses/ue-pro"
 * - getWikiPath("", "courses#anchor") -> "/courses#anchor"
 * - getWikiPath("", "") -> "/"
 *
 * Examples with basePath = "/wiki":
 * - getWikiPath("/wiki", "community") -> "/wiki/community"
 * - getWikiPath("/wiki", "courses/ue-pro") -> "/wiki/courses/ue-pro"
 * - getWikiPath("/wiki", "courses#anchor") -> "/wiki/courses#anchor"
 * - getWikiPath("/wiki", "") -> "/wiki"
 */
export function getWikiPath(basePath: string | undefined, subpath: string): string {
  const base = normalizeBasePath(basePath);
  const clean = (subpath || "").replace(/^\/+/, "");
  if (!clean) return base || "/";

  // If subpath contains a hash or query anchor e.g. "community#anchor"
  return base ? `${base}/${clean}` : `/${clean}`;
}
