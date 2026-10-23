import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import type { WikiPage } from "../../types";

/** Returns `prev` unchanged when it already contains every addition, so state updates bail out. */
function addMissing(prev: Set<string>, additions: Set<string>): Set<string> {
  for (const k of additions) {
    if (!prev.has(k)) return new Set([...prev, ...additions]);
  }
  return prev;
}

/**
 * Builds parent → children map: a section is a child if its slug starts with
 * parentSlug + "-" OR its parent === parentSlug.
 */
function buildSubSectionMap(wikiSections: WikiPage[]) {
  const childSlugs = new Set<string>();
  const subSectionMap = new Map<string, WikiPage[]>();
  for (const page of wikiSections) {
    for (const other of wikiSections) {
      const isChild =
        (other.parent && other.parent === page.slug) ||
        (other.slug !== page.slug && other.slug.startsWith(page.slug + "-"));
      if (isChild) {
        childSlugs.add(other.slug);
        const arr = subSectionMap.get(page.slug) ?? [];
        arr.push(other);
        subSectionMap.set(page.slug, arr);
      }
    }
  }

  for (const [, arr] of subSectionMap.entries()) {
    arr.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.slug.localeCompare(b.slug, undefined, { numeric: true });
    });
  }

  return { childSlugs, subSectionMap };
}

/** Open/closed state of the sidebar tree, kept in sync with the active route. */
export function useNavTree(wikiSections: WikiPage[]) {
  const {
    slug: activeSlug,
    section: activeSection,
    lecture: activeLecture,
  } = useParams<{
    slug: string;
    section: string;
    lecture: string;
  }>();
  const currentSection = activeSlug ?? activeSection;

  const computeOpenSet = useCallback(
    (sectionSlug: string | undefined): Set<string> => {
      const s = new Set<string>();
      if (!sectionSlug) return s;
      s.add(sectionSlug);
      const curPage = wikiSections.find((p) => p.slug === sectionSlug);
      if (curPage?.parent) {
        s.add(curPage.parent);
      }
      for (const page of wikiSections) {
        if (sectionSlug !== page.slug && sectionSlug.startsWith(page.slug + "-")) {
          s.add(page.slug);
        }
      }
      return s;
    },
    [wikiSections],
  );

  const computeOpenLectures = useCallback(
    (secSlug: string | undefined, lecSlug: string | undefined): Set<string> => {
      const s = new Set<string>();
      if (!secSlug || !lecSlug) return s;
      for (const p of wikiSections) {
        if (p.slug === secSlug) {
          for (const l of p.lectures) {
            if (l.children && l.children.length > 0 && l.page) {
              if (
                l.page.slug === lecSlug ||
                l.number === lecSlug ||
                l.children.some((c) => c.page?.slug === lecSlug || c.number === lecSlug)
              ) {
                s.add(`${secSlug}/${l.page.slug}`);
              }
            }
          }
        }
      }
      return s;
    },
    [wikiSections],
  );

  const [openSections, setOpenSections] = useState<Set<string>>(() =>
    computeOpenSet(currentSection),
  );

  const [openLectures, setOpenLectures] = useState<Set<string>>(() =>
    computeOpenLectures(activeSection, activeLecture),
  );

  // Expand the tree to the active route when the route changes. Adjusted during
  // render (not in an effect) to avoid an extra render pass; the initial state
  // above already covers the first render.
  const [expandedSection, setExpandedSection] = useState(currentSection);
  if (expandedSection !== currentSection) {
    setExpandedSection(currentSection);
    if (currentSection) {
      setOpenSections((prev) => addMissing(prev, computeOpenSet(currentSection)));
    }
  }

  const lectureKey = `${activeSection ?? ""}/${activeLecture ?? ""}`;
  const [expandedLectureKey, setExpandedLectureKey] = useState(lectureKey);
  if (expandedLectureKey !== lectureKey) {
    setExpandedLectureKey(lectureKey);
    if (activeSection && activeLecture) {
      setOpenLectures((prev) =>
        addMissing(prev, computeOpenLectures(activeSection, activeLecture)),
      );
    }
  }

  const toggleSection = useCallback((slug: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const toggleLecture = useCallback((key: string) => {
    setOpenLectures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isAllExpanded =
    wikiSections.length > 0 &&
    wikiSections.every((s) => openSections.has(s.slug)) &&
    wikiSections.every((s) =>
      s.lectures.every((l) =>
        l.children && l.children.length > 0 && l.page
          ? openLectures.has(`${s.slug}/${l.page.slug}`)
          : true,
      ),
    );

  const expandAll = () => {
    setOpenSections(new Set(wikiSections.map((p) => p.slug)));
    const allLecs = new Set<string>();
    for (const s of wikiSections) {
      for (const l of s.lectures) {
        if (l.children && l.children.length > 0 && l.page) {
          allLecs.add(`${s.slug}/${l.page.slug}`);
        }
      }
    }
    setOpenLectures(allLecs);
  };

  const collapseAll = () => {
    setOpenSections(new Set());
    setOpenLectures(new Set());
  };

  const toggleAll = () => {
    if (isAllExpanded) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  const { childSlugs, subSectionMap } = buildSubSectionMap(wikiSections);

  return {
    openSections,
    openLectures,
    toggleSection,
    toggleLecture,
    isAllExpanded,
    toggleAll,
    childSlugs,
    subSectionMap,
  };
}

export type NavTreeState = ReturnType<typeof useNavTree>;
