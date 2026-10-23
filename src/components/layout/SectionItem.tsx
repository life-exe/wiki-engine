import { NavLink, useLocation, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Lecture, WikiPage, WikiCategoryConfig } from "../../types";
import { useWiki } from "../../context/WikiContext";
import { WikiIcon } from "../WikiIcon";
import {
  getCardActiveStyles,
  getCardInactiveStyles,
  getItemActiveStyles,
  getItemInactiveStyles,
  resolveCategoryLabel,
  resolveCoverUrl,
} from "./navStyles";
import { LectureItem } from "./LectureItem";

export function SectionItem({
  page,
  open,
  onToggle,
  subSections = [],
  openSections,
  onToggleSection,
  openLectures,
  onToggleLecture,
  depth = 0,
  subSectionMap,
}: {
  page: WikiPage;
  open: boolean;
  onToggle: () => void;
  subSections?: WikiPage[];
  openSections: Set<string>;
  onToggleSection: (slug: string) => void;
  openLectures: Set<string>;
  onToggleLecture: (key: string) => void;
  depth?: number;
  subSectionMap?: Map<string, WikiPage[]>;
}) {
  const location = useLocation();
  const { slug, section } = useParams<{ slug: string; section: string }>();
  const { lang, data, config, getWikiUrl } = useWiki();
  const title = lang === "en" && page.titleEn ? page.titleEn : page.title;
  const hasChildren = page.lectures.length > 0 || subSections.length > 0;

  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const rootPath = getWikiUrl("");
  const pagePath = getWikiUrl(page.slug);
  const isIndexPage =
    (page.slug === (data.wikiIndex?.slug ?? "welcome") ||
      page.slug === "00-welcome" ||
      page.slug === "welcome" ||
      page.slug === "README") &&
    (currentPath === rootPath || currentPath === "/wiki");
  const isActive = slug === page.slug || section === page.slug || isIndexPage;

  const textSize = depth === 0 ? "text-base" : "text-sm";
  const isExactPage =
    (currentPath === pagePath ||
      (isIndexPage && (currentPath === rootPath || currentPath === "/wiki"))) &&
    !location.hash;

  const isCourse = page.parent === "courses";
  const coverRaw = isCourse ? (page.thumb ?? page.cover) : undefined;
  const coverUrl = resolveCoverUrl(coverRaw, page.slug, data?.wikiImages);
  const hasCover = Boolean(coverUrl);

  const isCoursesContainer = page.slug === "courses";

  type NavItem =
    | { type: "lecture"; lecture: Lecture; key: string; order: number; hasCover: boolean }
    | { type: "section"; section: WikiPage; key: string; order: number; hasCover: boolean };

  const combinedItems: NavItem[] = [
    ...page.lectures.map((lecture) => {
      const num = lecture.number || lecture.anchorSlug.match(/^(\d+)/)?.[1];
      const order = lecture.order ?? lecture.page?.order ?? (num ? parseInt(num, 10) : 999);
      const isItemCourse = isCoursesContainer || lecture.page?.parent === "courses";
      const hasCoverItem =
        isItemCourse &&
        Boolean(lecture.thumb ?? lecture.page?.thumb ?? lecture.cover ?? lecture.page?.cover);
      return {
        type: "lecture" as const,
        lecture,
        key: `lec-${lecture.anchorSlug}`,
        order,
        hasCover: hasCoverItem,
      };
    }),
    ...subSections.map((sub) => {
      let order = sub.order;
      if (order === undefined) {
        const num = sub.slug.match(/^(\d+)/)?.[1];
        order = num ? parseInt(num, 10) : 999;
      }
      const isItemCourse = sub.parent === "courses";
      const hasCoverItem = isItemCourse && Boolean(sub.thumb ?? sub.cover);
      return {
        type: "section" as const,
        section: sub,
        key: `sec-${sub.slug}`,
        order,
        hasCover: hasCoverItem,
      };
    }),
  ];

  const hasOrderedItems = combinedItems.some((i) => i.order !== 999);
  if (hasOrderedItems) {
    combinedItems.sort((a, b) => a.order - b.order);
  }

  const hasCoverChildren = combinedItems.some((i) => i.hasCover);

  const sectionCategories =
    config.sectionCategories?.[page.slug] ??
    config.categories?.filter((c) => c.section === page.slug);

  const filterCategoryItem = (cat: WikiCategoryConfig, item: NavItem): boolean => {
    if (cat.filter) {
      return item.type === "lecture" ? cat.filter(item.lecture) : cat.filter(item.section);
    }
    const slug =
      item.type === "lecture"
        ? (item.lecture.page?.slug ?? item.lecture.anchorSlug)
        : item.section.slug;
    if (cat.pattern) {
      return cat.pattern.test(slug);
    }
    if (cat.from !== undefined && cat.to !== undefined) {
      const numStr =
        item.type === "lecture"
          ? item.lecture.number || (slug.match(/^(\d+)/)?.[1] ?? "")
          : item.section.order !== undefined
            ? String(item.section.order)
            : (slug.match(/^(\d+)/)?.[1] ?? "");
      const n = parseInt(numStr, 10);
      const fromVal = parseInt(cat.from, 10);
      const toVal = parseInt(cat.to, 10);
      if (!isNaN(n) && !isNaN(fromVal) && !isNaN(toVal)) {
        return n >= fromVal && n <= toVal;
      }
      return numStr >= cat.from && numStr <= cat.to;
    }
    return true;
  };

  return (
    <li>
      {hasChildren ? (
        <div
          className={`group flex items-center justify-between w-full transition-all duration-150 ${
            hasCover
              ? isActive && isExactPage
                ? getCardActiveStyles()
                : isActive
                  ? "border-l-2 border-primary/50 text-foreground font-medium rounded-lg hover:bg-accent/70"
                  : getCardInactiveStyles()
              : isActive && isExactPage
                ? getItemActiveStyles(depth)
                : isActive
                  ? depth === 0
                    ? "border-l-2 border-transparent text-primary font-medium hover:bg-accent/80 rounded-md"
                    : "border-l-2 border-transparent text-primary font-medium hover:bg-accent/80 -ml-px rounded-r-md rounded-l-none"
                  : getItemInactiveStyles(depth)
          }`}
        >
          <NavLink
            to={getWikiUrl(page.slug)}
            onClick={(e) => {
              if (isExactPage) {
                if (e.detail > 0) {
                  e.preventDefault();
                  onToggle();
                }
              } else {
                if (!open) {
                  onToggle();
                }
              }
            }}
            className={`flex-1 min-w-0 transition-colors focus:outline-none ${
              hasCover
                ? "p-1.5 pr-1 flex items-center gap-2.5"
                : `px-2.5 py-1.5 ${depth === 0 ? "rounded-l-md" : ""} ${textSize} truncate ${
                    isActive && !isExactPage ? "text-primary font-medium" : ""
                  }`
            }`}
          >
            {hasCover ? (
              <>
                <img
                  src={coverUrl}
                  alt=""
                  loading="lazy"
                  className="w-14 h-8 shrink-0 rounded-md object-cover border border-border/40 shadow-xs"
                />
                <span className="line-clamp-2 text-xs sm:text-[13px] leading-snug font-medium flex-1">
                  {title}
                </span>
              </>
            ) : (
              <span className="flex items-center gap-2.5 min-w-0">
                {depth === 0 && <WikiIcon name={page.icon} className="opacity-80 shrink-0" />}
                <span className="truncate">{title}</span>
              </span>
            )}
          </NavLink>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-1.5 mr-1 shrink-0 cursor-pointer text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none"
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      ) : (
        <NavLink
          to={getWikiUrl(page.slug)}
          className={({ isActive: navActive }) =>
            hasCover
              ? `flex items-center gap-2.5 w-full p-1.5 pr-2 transition-all duration-150 focus:outline-none ${
                  navActive || (isActive && isExactPage)
                    ? getCardActiveStyles()
                    : getCardInactiveStyles()
                }`
              : `flex items-center w-full px-2.5 py-1.5 ${textSize} truncate transition-all duration-150 focus:outline-none ${
                  isActive ? getItemActiveStyles(depth) : getItemInactiveStyles(depth)
                }`
          }
        >
          {hasCover ? (
            <>
              <img
                src={coverUrl}
                alt=""
                loading="lazy"
                className="w-14 h-8 shrink-0 rounded-md object-cover border border-border/40 shadow-xs"
              />
              <span className="line-clamp-2 text-xs sm:text-[13px] leading-snug font-medium flex-1">
                {title}
              </span>
            </>
          ) : (
            <>
              {depth === 0 && <WikiIcon name={page.icon} className="opacity-80 mr-2.5 shrink-0" />}
              <span className="truncate">{title}</span>
            </>
          )}
        </NavLink>
      )}

      {open &&
        hasChildren &&
        (sectionCategories && sectionCategories.length > 0 ? (
          <div className="mt-1 space-y-3">
            {(() => {
              const usedKeys = new Set<string>();
              const renderedCategories = sectionCategories.map((cat, idx) => {
                const catItems = combinedItems.filter((item) => filterCategoryItem(cat, item));
                if (catItems.length === 0) return null;
                catItems.forEach((i) => usedKeys.add(i.key));
                const label = resolveCategoryLabel(cat, lang);
                return (
                  <div
                    key={cat.id ?? idx}
                    className="mt-4 first:mt-1 pt-3 first:pt-0 border-t first:border-t-0 border-border/40"
                  >
                    <div className="px-2.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 select-none">
                      {label}
                    </div>
                    <ul
                      className={
                        hasCoverChildren
                          ? "space-y-1 pl-1.5 pr-1"
                          : "ml-3.5 border-l border-border space-y-0.5"
                      }
                    >
                      {catItems.map((item) =>
                        item.type === "lecture" ? (
                          <LectureItem
                            key={item.lecture.anchorSlug}
                            lecture={item.lecture}
                            sectionSlug={page.slug}
                            openLectures={openLectures}
                            onToggleLecture={onToggleLecture}
                            depth={depth + 1}
                          />
                        ) : (
                          <SectionItem
                            key={item.section.slug}
                            page={item.section}
                            open={openSections.has(item.section.slug)}
                            onToggle={() => onToggleSection(item.section.slug)}
                            subSections={subSectionMap?.get(item.section.slug) ?? []}
                            openSections={openSections}
                            onToggleSection={onToggleSection}
                            openLectures={openLectures}
                            onToggleLecture={onToggleLecture}
                            depth={depth + 1}
                            subSectionMap={subSectionMap}
                          />
                        ),
                      )}
                    </ul>
                  </div>
                );
              });

              const remainingItems = combinedItems.filter((i) => !usedKeys.has(i.key));

              return (
                <>
                  {renderedCategories}
                  {remainingItems.length > 0 && (
                    <ul
                      className={
                        hasCoverChildren
                          ? "space-y-1 pl-1.5 pr-1"
                          : "ml-3.5 border-l border-border space-y-0.5"
                      }
                    >
                      {remainingItems.map((item) =>
                        item.type === "lecture" ? (
                          <LectureItem
                            key={item.lecture.anchorSlug}
                            lecture={item.lecture}
                            sectionSlug={page.slug}
                            openLectures={openLectures}
                            onToggleLecture={onToggleLecture}
                            depth={depth + 1}
                          />
                        ) : (
                          <SectionItem
                            key={item.section.slug}
                            page={item.section}
                            open={openSections.has(item.section.slug)}
                            onToggle={() => onToggleSection(item.section.slug)}
                            subSections={subSectionMap?.get(item.section.slug) ?? []}
                            openSections={openSections}
                            onToggleSection={onToggleSection}
                            openLectures={openLectures}
                            onToggleLecture={onToggleLecture}
                            depth={depth + 1}
                            subSectionMap={subSectionMap}
                          />
                        ),
                      )}
                    </ul>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <ul
            className={
              hasCoverChildren
                ? "mt-1.5 space-y-1 pl-1.5 pr-1"
                : "ml-3.5 border-l border-border mt-0.5 space-y-0.5"
            }
          >
            {combinedItems.map((item) =>
              item.type === "lecture" ? (
                <LectureItem
                  key={item.lecture.anchorSlug}
                  lecture={item.lecture}
                  sectionSlug={page.slug}
                  openLectures={openLectures}
                  onToggleLecture={onToggleLecture}
                  depth={depth + 1}
                />
              ) : (
                <SectionItem
                  key={item.section.slug}
                  page={item.section}
                  open={openSections.has(item.section.slug)}
                  onToggle={() => onToggleSection(item.section.slug)}
                  subSections={subSectionMap?.get(item.section.slug) ?? []}
                  openSections={openSections}
                  onToggleSection={onToggleSection}
                  openLectures={openLectures}
                  onToggleLecture={onToggleLecture}
                  depth={depth + 1}
                  subSectionMap={subSectionMap}
                />
              ),
            )}
          </ul>
        ))}
    </li>
  );
}
