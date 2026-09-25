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

/**
 * Returns true if the given URL is an absolute external link (http, https, mailto, tel, file, //).
 */
export function isExternalUrl(url?: string): boolean {
  if (!url) return false;
  return /^(?:[a-z+]+:)?\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url);
}

/**
 * Returns true if the URL points to a non-markdown static asset or download file (.zip, .pdf, images, etc.).
 */
export function isAssetUrl(url?: string): boolean {
  if (!url) return false;
  const withoutHashOrQuery = url.split("#")[0].split("?")[0];
  return /\.(?:zip|tar|gz|rar|7z|pdf|png|jpe?g|gif|svg|webp|ico|mp4|webm|mp3|wav|ogg)$/i.test(
    withoutHashOrQuery,
  );
}

export interface ResolveWikiLinkOptions {
  href: string;
  currentSectionSlug?: string;
  wikiPages?: Array<{
    slug: string;
    lectures?: Array<{
      anchorSlug?: string;
      page?: { slug: string } | null;
    }>;
  }>;
}

/**
 * Resolves a markdown link href (which might be relative, include .md, etc.)
 * into a normalized wiki subpath (e.g. "01-intro/01-about-course") and hash (e.g. "#heading").
 */
export function resolveWikiLink(options: ResolveWikiLinkOptions): {
  subpath: string;
  hash: string;
} {
  const { href, currentSectionSlug, wikiPages = [] } = options;

  const hashIdx = href.indexOf("#");
  const withoutHash = hashIdx !== -1 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx !== -1 ? href.slice(hashIdx) : "";

  const queryIdx = withoutHash.indexOf("?");
  const withoutQuery = queryIdx !== -1 ? withoutHash.slice(0, queryIdx) : withoutHash;
  const query = queryIdx !== -1 ? withoutHash.slice(queryIdx) : "";

  let p = withoutQuery.trim();

  // Strip leading ../ and ./ sequences
  p = p.replace(/^(?:\.\.\/|\.\/)+/, "");
  // Strip leading slashes
  p = p.replace(/^\/+/, "");
  // Strip markdown extension
  p = p.replace(/\.(?:md|markdown)$/i, "");
  // Strip sprint / readme / index suffix
  p = p.replace(/\/(?:sprint|readme|index)$/i, "");

  if (!p) {
    return { subpath: "", hash: query + hash };
  }

  // 1. Check if p directly matches a section slug
  const directSection = wikiPages.find((sec) => sec.slug === p);
  if (directSection) {
    return { subpath: directSection.slug, hash: query + hash };
  }

  // 2. If p has multiple segments: "section/lecture" or "sprints/cpp-engineering/02-cmake-empty-project"
  if (p.includes("/")) {
    const segments = p.split("/").filter(Boolean);

    // Check if the first segment matches a section directly
    const firstSec = wikiPages.find((sec) => sec.slug === segments[0]);
    if (firstSec) {
      return { subpath: segments.join("/"), hash: query + hash };
    }

    // Check fuzzy match on segments[0] (e.g. "cpp-engineering" matching "03-cpp-engineering")
    const fuzzySec = wikiPages.find(
      (sec) =>
        sec.slug === segments[0] ||
        sec.slug.endsWith(`-${segments[0]}`) ||
        sec.slug.replace(/^\d+-/, "") === segments[0],
    );
    if (fuzzySec) {
      const rest = segments.slice(1).join("/");
      return { subpath: `${fuzzySec.slug}/${rest}`, hash: query + hash };
    }

    // If segments starts with "sprints" or "variants"
    if (segments.length >= 3 && (segments[0] === "sprints" || segments[0] === "variants")) {
      const stageSegment = segments[segments.length - 2];
      const lectureSegment = segments[segments.length - 1];
      const matchedSec = wikiPages.find(
        (sec) =>
          sec.slug === stageSegment ||
          sec.slug.endsWith(`-${stageSegment}`) ||
          sec.slug.replace(/^\d+-/, "") === stageSegment,
      );
      if (matchedSec) {
        return { subpath: `${matchedSec.slug}/${lectureSegment}`, hash: query + hash };
      }
    }

    // Check if last segment matches a lecture in any section
    const lastSlug = segments[segments.length - 1];
    for (const sec of wikiPages) {
      const hasLecture = sec.lectures?.some(
        (l) => l.page?.slug === lastSlug || l.anchorSlug === lastSlug,
      );
      if (hasLecture) {
        return { subpath: `${sec.slug}/${lastSlug}`, hash: query + hash };
      }
    }

    return { subpath: p, hash: query + hash };
  }

  // 3. Single slug: check if it's a lecture in current section
  if (currentSectionSlug) {
    const currentSec = wikiPages.find((sec) => sec.slug === currentSectionSlug);
    if (currentSec?.lectures?.some((l) => l.page?.slug === p || l.anchorSlug === p)) {
      return { subpath: `${currentSectionSlug}/${p}`, hash: query + hash };
    }
  }

  // 4. Single slug: check if it's a lecture in ANY section
  for (const sec of wikiPages) {
    if (sec.lectures?.some((l) => l.page?.slug === p || l.anchorSlug === p)) {
      return { subpath: `${sec.slug}/${p}`, hash: query + hash };
    }
  }

  // 5. Fallback: single slug as section or subpath
  return { subpath: p, hash: query + hash };
}

