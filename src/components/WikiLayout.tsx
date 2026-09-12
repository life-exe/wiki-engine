import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { NavLink, Outlet, useParams, useLocation } from "react-router-dom";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsDown,
  ChevronsUp,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { WikiPage, WikiCategoryConfig, Lecture, WikiHeaderLink } from "../types";
import { useWiki } from "../context/WikiContext";
import { WikiIcon } from "./WikiIcon";
import { SearchPopup } from "./SearchPopup";
import { CookieConsent } from "./CookieConsent";

const getItemActiveStyles = (depth: number) =>
  depth === 0
    ? "bg-accent text-foreground font-medium border-l-2 border-primary"
    : "bg-accent text-foreground font-medium";

const getItemInactiveStyles = (depth: number) =>
  depth === 0
    ? "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/80"
    : "text-muted-foreground hover:text-foreground hover:bg-accent/80";

function LectureItem({
  lecture,
  sectionSlug,
  openLectures,
  onToggleLecture,
  depth = 1,
}: {
  lecture: Lecture;
  sectionSlug: string;
  openLectures: Set<string>;
  onToggleLecture: (key: string) => void;
  depth?: number;
}) {
  const { lang } = useWiki();
  const location = useLocation();
  const { lecture: activeLecture } = useParams<{ lecture: string }>();
  const lTitle = lang === "en" && lecture.titleEn ? lecture.titleEn : lecture.title;
  const hasChildren = Boolean(lecture.children && lecture.children.length > 0);
  const lectureKey = lecture.page ? `${sectionSlug}/${lecture.page.slug}` : "";
  const isOpen = lectureKey ? openLectures.has(lectureKey) : false;

  const lecturePath = lecture.page
    ? `/wiki/${sectionSlug}/${lecture.page.slug}`
    : `/wiki/${sectionSlug}`;
  const isHashActive =
    !lecture.page &&
    location.pathname === `/wiki/${sectionSlug}` &&
    location.hash === `#${lecture.anchorSlug}`;
  const isSelfActive = Boolean(
    lecture.page &&
      (activeLecture === lecture.page.slug || activeLecture === lecture.number),
  );
  const isItemActive = Boolean(
    isSelfActive ||
      isHashActive ||
      (lecture.page && location.pathname.replace(/\/+$/, "") === lecturePath),
  );
  const iconName = lecture.icon ?? lecture.page?.icon;

  return (
    <li>
      {hasChildren ? (
        <div
          className={`relative group flex items-center justify-between w-full rounded-md transition-all duration-150 ${
            isItemActive ? getItemActiveStyles(depth) : getItemInactiveStyles(depth)
          }`}
        >
          {isItemActive && depth > 0 && <span className="tree-active-indicator" />}
          <NavLink
            to={
              lecture.page
                ? `/wiki/${sectionSlug}/${lecture.page.slug}`
                : `/wiki/${sectionSlug}#${lecture.anchorSlug}`
            }
            onClick={
              lectureKey
                ? () => {
                    if (!isOpen) onToggleLecture(lectureKey);
                  }
                : undefined
            }
            className={`flex-1 py-1.5 px-2.5 text-sm truncate focus:outline-none ${
              isItemActive ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
            } ${lecture.page ? "" : "opacity-60"}`}
          >
            <span className="flex items-center gap-2 min-w-0">
              <WikiIcon name={iconName} className="opacity-80 shrink-0" />
              <span className="truncate">{lTitle}</span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (lectureKey) onToggleLecture(lectureKey);
            }}
            className="p-1 mr-1 shrink-0 cursor-pointer text-muted-foreground group-hover:text-foreground transition-colors focus:outline-none"
          >
            <ChevronRight
              size={13}
              className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      ) : (
        <NavLink
          to={
            lecture.page
              ? `/wiki/${sectionSlug}/${lecture.page.slug}`
              : `/wiki/${sectionSlug}#${lecture.anchorSlug}`
          }
          className={`relative flex items-center w-full px-2.5 py-1.5 rounded-md text-sm transition-all duration-150 truncate focus:outline-none ${
            isItemActive ? getItemActiveStyles(depth) : getItemInactiveStyles(depth)
          } ${lecture.page ? "" : "opacity-60"}`}
        >
          {isItemActive && depth > 0 && <span className="tree-active-indicator" />}
          <WikiIcon name={iconName} className="opacity-80 mr-2 shrink-0" />
          <span className="truncate">{lTitle}</span>
        </NavLink>
      )}

      {hasChildren && isOpen && (
        <ul className="ml-3.5 border-l border-border pl-1.5 mt-0.5 space-y-0.5">
          {lecture.children!.map((child: Lecture) => (
            <LectureItem
              key={child.anchorSlug}
              lecture={child}
              sectionSlug={sectionSlug}
              openLectures={openLectures}
              onToggleLecture={onToggleLecture}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function SectionItem({
  page,
  open,
  onToggle,
  subSections = [],
  openSections,
  onToggleSection,
  openLectures,
  onToggleLecture,
  depth = 0,
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
}) {
  const location = useLocation();
  const { slug, section } = useParams<{ slug: string; section: string }>();
  const isIndexPage =
    (page.slug === "00-welcome" || page.slug === "welcome" || page.slug === "README") &&
    (location.pathname === "/" || location.pathname === "" || location.pathname === "/wiki");
  const isActive = slug === page.slug || section === page.slug || isIndexPage;
  const { lang } = useWiki();
  const title = lang === "en" && page.titleEn ? page.titleEn : page.title;
  const hasChildren = page.lectures.length > 0 || subSections.length > 0;

  const textSize = depth === 0 ? "text-base" : "text-sm";
  const isExactPage =
    (location.pathname.replace(/\/+$/, "") === `/wiki/${page.slug}` ||
      (isIndexPage && (location.pathname === "/" || location.pathname === "" || location.pathname === "/wiki"))) &&
    !location.hash;

  type NavItem =
    | { type: "lecture"; lecture: Lecture; key: string; order: number }
    | { type: "section"; section: WikiPage; key: string; order: number };

  const combinedItems: NavItem[] = [
    ...page.lectures.map((lecture) => {
      const num = lecture.number || lecture.anchorSlug.match(/^(\d+)/)?.[1];
      const order = lecture.order ?? lecture.page?.order ?? (num ? parseInt(num, 10) : 999);
      return {
        type: "lecture" as const,
        lecture,
        key: `lec-${lecture.anchorSlug}`,
        order,
      };
    }),
    ...subSections.map((sub) => {
      let order = sub.order;
      if (order === undefined) {
        const num = sub.slug.match(/^(\d+)/)?.[1];
        order = num ? parseInt(num, 10) : 999;
      }
      return {
        type: "section" as const,
        section: sub,
        key: `sec-${sub.slug}`,
        order,
      };
    }),
  ];

  const hasOrderedItems = combinedItems.some((i) => i.order !== 999);
  if (hasOrderedItems) {
    combinedItems.sort((a, b) => a.order - b.order);
  }

  return (
    <li>
      {hasChildren ? (
        <div
          className={`relative group flex items-center justify-between w-full rounded-md transition-all duration-150 ${
            isActive && isExactPage
              ? getItemActiveStyles(depth)
              : isActive
                ? depth === 0
                  ? "border-l-2 border-transparent text-primary font-medium hover:bg-accent/80"
                  : "text-primary font-medium hover:bg-accent/80"
                : getItemInactiveStyles(depth)
          }`}
        >
          {isActive && isExactPage && depth > 0 && <span className="tree-active-indicator" />}
          <NavLink
            to={`/wiki/${page.slug}`}
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
            className={`flex-1 px-2.5 py-1.5 rounded-l-md ${textSize} truncate transition-colors focus:outline-none ${
              isActive && !isExactPage ? "text-primary font-medium" : ""
            }`}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <WikiIcon name={page.icon} className="opacity-80 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
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
          to={`/wiki/${page.slug}`}
          className={`relative flex items-center w-full px-2.5 py-1.5 rounded-md ${textSize} truncate transition-all duration-150 focus:outline-none ${
            isActive ? getItemActiveStyles(depth) : getItemInactiveStyles(depth)
          }`}
        >
          {isActive && depth > 0 && <span className="tree-active-indicator" />}
          <WikiIcon name={page.icon} className="opacity-80 mr-2.5 shrink-0" />
          <span className="truncate">{title}</span>
        </NavLink>
      )}

      {open && hasChildren && (
        <ul className="ml-3.5 border-l border-border pl-1.5 mt-0.5 space-y-0.5">
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
                subSections={[]}
                openSections={openSections}
                onToggleSection={onToggleSection}
                openLectures={openLectures}
                onToggleLecture={onToggleLecture}
                depth={depth + 1}
              />
            ),
          )}
        </ul>
      )}
    </li>
  );
}

const MIN_WIDTH = 160;
const MAX_WIDTH = 600;

export function WikiLayout() {
  const { config, data, lang, setLang, theme, toggleTheme } = useWiki();
  const { wikiSections } = data;

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const prevWidth = useRef(420);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (config.enableSearch === false) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [config.enableSearch]);

  const { slug: activeSlug, section: activeSection, lecture: activeLecture } = useParams<{
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

  useEffect(() => {
    if (currentSection) {
      setOpenSections((prev) => {
        const additions = computeOpenSet(currentSection);
        let changed = false;
        for (const s of additions) {
          if (!prev.has(s)) {
            changed = true;
            break;
          }
        }
        if (!changed) return prev;
        return new Set([...prev, ...additions]);
      });
    }
  }, [currentSection, computeOpenSet]);

  useEffect(() => {
    if (activeSection && activeLecture) {
      const additions = computeOpenLectures(activeSection, activeLecture);
      if (additions.size > 0) {
        setOpenLectures((prev) => {
          let changed = false;
          for (const k of additions) {
            if (!prev.has(k)) {
              changed = true;
              break;
            }
          }
          return changed ? new Set([...prev, ...additions]) : prev;
        });
      }
    }
  }, [activeSection, activeLecture, computeOpenLectures]);

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
  const dragging = useRef(false);
  const mainRef = useRef<HTMLElement>(null);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.scrollTo(0, 0);

    if (hash) {
      const raw = hash.slice(1);
      let targetId: string;
      try {
        targetId = decodeURIComponent(raw);
      } catch {
        targetId = raw;
      }

      const scrollToElement = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          return true;
        }
        return false;
      };

      if (!scrollToElement()) {
        const frameId = requestAnimationFrame(() => {
          scrollToElement();
        });
        return () => cancelAnimationFrame(frameId);
      }
    }
  }, [pathname, hash]);

  // Build parent → children map: a section is a child if its slug starts with parentSlug + "-" OR its parent === parentSlug
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

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.body.classList.add("resizing");

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.classList.remove("resizing");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const resolveBrandTitle = (): ReactNode => {
    const raw = config.brand.title;
    if (typeof raw === "object" && raw !== null && ("ru" in raw || "en" in raw)) {
      const loc = raw as Record<string, ReactNode>;
      return loc[lang] ?? loc["ru"] ?? loc["en"] ?? "";
    }
    return raw as ReactNode;
  };

  const resolveCategoryLabel = (cat: WikiCategoryConfig): string => {
    if (typeof cat.label === "string") return cat.label;
    if (typeof cat.label === "object") {
      return cat.label[lang] ?? cat.label["ru"] ?? cat.label["en"] ?? "";
    }
    return "";
  };

  const filterCategoryPages = (cat: WikiCategoryConfig): WikiPage[] => {
    return wikiSections.filter((p) => {
      if (childSlugs.has(p.slug)) return false;
      if (cat.filter) return cat.filter(p);
      if (cat.pattern) return cat.pattern.test(p.slug);
      if (cat.from !== undefined && cat.to !== undefined) {
        const n = p.slug.match(/^(\d+)/)?.[1] ?? "0";
        return n >= cat.from && n <= cat.to;
      }
      return true;
    });
  };

  const supportedLanguages = config.supportedLanguages ?? ["ru", "en"];
  const showLangToggle = supportedLanguages.length > 1;

  const headerLinks: WikiHeaderLink[] =
    config.headerLinks ??
    (config.socialLinks?.map((s) => ({
      label: s.name,
      url: s.url,
      external: true,
    })) ?? []);

  const poweredByConfig = typeof config.poweredBy === "object" ? config.poweredBy : undefined;
  const poweredByEnabled = config.poweredBy !== false;
  const poweredByUrl = poweredByConfig?.url ?? "https://github.com/life-exe/wiki-engine";
  const poweredByPrefix = poweredByConfig?.prefix
    ? typeof poweredByConfig.prefix === "object"
      ? poweredByConfig.prefix[lang] ?? poweredByConfig.prefix["ru"] ?? poweredByConfig.prefix["en"] ?? "Powered by"
      : poweredByConfig.prefix
    : "Powered by";
  const poweredByText = poweredByConfig?.text
    ? typeof poweredByConfig.text === "object"
      ? poweredByConfig.text[lang] ?? poweredByConfig.text["ru"] ?? poweredByConfig.text["en"] ?? "life-exe wiki engine"
      : poweredByConfig.text
    : "life-exe wiki engine";

  const currentYear = new Date().getFullYear();
  const defaultTagline =
    lang === "ru"
      ? "Все права защищены, все коммиты запушены"
      : "All rights reserved, all commits pushed";

  const poweredByTagline =
    poweredByConfig?.tagline !== undefined
      ? typeof poweredByConfig.tagline === "object"
        ? poweredByConfig.tagline[lang] ?? poweredByConfig.tagline["ru"] ?? poweredByConfig.tagline["en"]
        : poweredByConfig.tagline
      : defaultTagline;
  const poweredByCopyright =
    poweredByConfig?.copyright !== undefined
      ? typeof poweredByConfig.copyright === "object"
        ? poweredByConfig.copyright[lang] ?? poweredByConfig.copyright["ru"] ?? poweredByConfig.copyright["en"]
        : poweredByConfig.copyright
      : undefined;

  const footerElement = (
    <footer className="mt-auto shrink-0">
      <div className="max-w-4xl mx-auto px-8">
        <div className="border-t border-border/40 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground select-none">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
            {poweredByCopyright !== "" && (
              <span className="font-normal text-muted-foreground/80 flex items-center gap-1">
                {poweredByCopyright !== undefined ? (
                  <>
                    <span>© {currentYear}</span>
                    <span className="font-semibold text-foreground/90">{poweredByCopyright}</span>
                  </>
                ) : (
                  <>
                    <span>© {currentYear}</span>
                    <span className="font-semibold text-foreground/90">LIFE.EXE</span>
                    <span className="inline-block w-1.5 h-1.5 bg-[#F04104] rounded-xs ml-0.5" />
                  </>
                )}
              </span>
            )}
            {poweredByTagline && (
              <>
                {poweredByCopyright !== "" && (
                  <span className="hidden sm:inline text-muted-foreground/30">•</span>
                )}
                <span className="text-muted-foreground/60">{poweredByTagline}</span>
              </>
            )}
          </div>

          <a
            href={poweredByUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors no-underline group"
          >
            {poweredByConfig?.icon ?? (
              <BookOpen
                size={14}
                className="shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors"
              />
            )}
            <span>
              {poweredByPrefix}{" "}
              <span className="font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                {poweredByText}
              </span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Header */}
      {config.enableHeader !== false && (
        <header className="sticky top-0 z-40 w-full h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center shrink-0 select-none relative">
          {/* Left: Mobile Menu Toggle + Brand Logo (matches sidebar width on desktop) */}
          <div
            style={{ width: isMobile ? undefined : (collapsed ? 48 : sidebarWidth) }}
            className="shrink-0 flex items-center px-4 transition-[width] duration-200"
          >
            <div className={`flex items-center gap-2 min-w-0 ${collapsed ? "absolute left-4 top-0 bottom-0 z-10" : ""}`}>
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-1"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              <NavLink
                to={config.brand.homeLink ?? "/"}
                className={`tracking-tight flex items-center gap-1.5 text-foreground hover:opacity-90 transition-opacity no-underline shrink-0 whitespace-nowrap ${
                  config.brand.className ?? "text-lg sm:text-xl font-black"
                }`}
              >
                {config.brand.logo && <span className="inline-block shrink-0">{config.brand.logo}</span>}
                <span>{resolveBrandTitle()}</span>
                {config.brand.showAccentDot !== false && (
                  <span className="inline-block w-2 h-2 bg-[#F04104] rounded-xs shrink-0"></span>
                )}
              </NavLink>
            </div>
          </div>

          {/* Resizer spacer to match the 1px resizer between sidebar and main */}
          {!isMobile && <div className="w-1 shrink-0" />}

          {/* Central area: matches main area, aligned with central block max-w-4xl px-8 */}
          <div className="flex-1 min-w-0 flex items-center h-full">
            <div className="max-w-4xl mx-auto px-8 w-full flex items-center justify-between gap-4">
              {/* Left edge of central block: Links */}
              <div className="flex items-center gap-5 xl:gap-6 min-w-0">
                {headerLinks.length > 0 && (
                  <nav className="flex items-center gap-4 xl:gap-6">
                    {headerLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target={link.external !== false ? "_blank" : undefined}
                        rel={link.external !== false ? "noopener noreferrer" : undefined}
                        className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors no-underline whitespace-nowrap"
                      >
                        {typeof link.label === "object"
                          ? link.label[lang] ?? link.label["ru"] ?? link.label["en"] ?? ""
                          : link.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>

              {/* Right edge of central block: Search + Theme Toggle + Lang Toggle */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                {/* Search Input Button */}
                {config.enableSearch !== false && (
                  <button
                    onClick={() => setSearchOpen(true)}
                    title={lang === "en" ? "Search (Ctrl+K)" : "Поиск (Ctrl+K)"}
                    className="flex items-center justify-center xl:justify-start gap-2 h-8 w-8 xl:w-44 2xl:w-52 xl:px-3 rounded-lg border border-border bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-sm text-left cursor-pointer focus:outline-none shrink-0"
                  >
                    <Search size={15} className="shrink-0" />
                    <span className="hidden xl:inline flex-1 truncate text-xs sm:text-sm">
                      {lang === "en" ? "Search..." : "Поиск..."}
                    </span>
                    <kbd className="hidden 2xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent border border-border shrink-0 select-none">
                      Ctrl K
                    </kbd>
                  </button>
                )}

                {/* Theme Toggle */}
                {config.enableThemeToggle !== false && (
                  <button
                    onClick={toggleTheme}
                    title={theme === "dark" ? (lang === "en" ? "Light theme" : "Светлая тема") : (lang === "en" ? "Dark theme" : "Тёмная тема")}
                    className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  </button>
                )}

                {/* Language Switcher */}
                {showLangToggle && (
                  <div className="flex rounded-md overflow-hidden border border-border text-xs font-semibold shrink-0">
                    {supportedLanguages.map((l) => (
                      <button
                        key={l}
                        onClick={() => setLang(l)}
                        className={`px-2 py-1 cursor-pointer transition-colors uppercase ${
                          lang === l
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Body: Sidebar + Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Desktop / Responsive Sidebar */}
        <aside
          style={{ width: collapsed ? 48 : sidebarWidth }}
          className={`shrink-0 ${isMobile ? "hidden" : "flex"} ${
            config.enableHeader !== false ? "h-[calc(100vh-3.5rem)]" : "h-screen"
          } flex-col transition-[width] duration-200 overflow-hidden bg-background border-r border-border`}
        >
          {/* Sidebar Toolbar: Expand/Collapse All + Sidebar Width Collapse */}
          <div
            className={`py-2 border-b border-border flex items-center justify-between gap-1 min-w-0 ${
              collapsed ? "px-2 justify-center" : "px-2.5"
            }`}
          >
            {!collapsed && (
              <button
                onClick={toggleAll}
                title={
                  isAllExpanded
                    ? (lang === "en" ? "Collapse all" : "Свернуть все")
                    : (lang === "en" ? "Expand all" : "Развернуть все")
                }
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                {isAllExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
                <span>
                  {isAllExpanded
                    ? (lang === "en" ? "Collapse" : "Свернуть")
                    : (lang === "en" ? "Expand" : "Развернуть")}
                </span>
              </button>
            )}
            <button
              onClick={() => {
                if (collapsed) {
                  setCollapsed(false);
                  setSidebarWidth(prevWidth.current || 400);
                } else {
                  prevWidth.current = sidebarWidth;
                  setCollapsed(true);
                }
              }}
              title={
                collapsed
                  ? (lang === "en" ? "Expand sidebar" : "Развернуть панель")
                  : (lang === "en" ? "Collapse sidebar" : "Свернуть панель")
              }
              className={`shrink-0 flex items-center justify-center w-8 h-8 aspect-square rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
                collapsed ? "mx-auto" : ""
              }`}
            >
              {collapsed ? (
                <ChevronsRight size={16} className="shrink-0" />
              ) : (
                <ChevronsLeft size={16} className="shrink-0" />
              )}
            </button>
          </div>

          {/* Navigation Tree */}
          <div
            className="p-3 flex-1 overflow-y-auto"
            style={{ display: collapsed ? "none" : undefined }}
          >
            {config.categories && config.categories.length > 0 ? (
              config.categories.map((cat, idx) => {
                const pages = filterCategoryPages(cat);
                if (pages.length === 0) return null;
                const label = resolveCategoryLabel(cat);
                return (
                  <div
                    key={cat.id ?? idx}
                    className="mt-6 first:mt-0 pt-4 first:pt-0 border-t first:border-t-0 border-border/40"
                  >
                    <div className="px-2.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 select-none">
                      {label}
                    </div>
                    <ul className="space-y-0.5">
                      {pages.map((page) => (
                        <SectionItem
                          key={page.slug}
                          page={page}
                          open={openSections.has(page.slug)}
                          onToggle={() => toggleSection(page.slug)}
                          subSections={subSectionMap.get(page.slug)}
                          openSections={openSections}
                          onToggleSection={toggleSection}
                          openLectures={openLectures}
                          onToggleLecture={toggleLecture}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })
            ) : (
              <ul className="space-y-0.5">
                {wikiSections
                  .filter((p) => !childSlugs.has(p.slug))
                  .map((page) => (
                    <SectionItem
                      key={page.slug}
                      page={page}
                      open={openSections.has(page.slug)}
                      onToggle={() => toggleSection(page.slug)}
                      subSections={subSectionMap.get(page.slug)}
                      openSections={openSections}
                      onToggleSection={toggleSection}
                      openLectures={openLectures}
                      onToggleLecture={toggleLecture}
                    />
                  ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Resizer */}
        {!isMobile && !collapsed && (
          <div
            onMouseDown={onMouseDown}
            className="w-1 shrink-0 cursor-col-resize bg-border/60 hover:bg-primary/50 transition-colors z-10"
          />
        )}

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className={`flex-1 overflow-y-auto flex flex-col ${
            config.enableHeader !== false ? "h-[calc(100vh-3.5rem)]" : "h-screen"
          }`}
        >
          <div className="flex-1">
            <Outlet />
          </div>
          {poweredByEnabled && footerElement}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-sm bg-background p-4 flex flex-col gap-3 shadow-2xl border-r border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <NavLink
                to={config.brand.homeLink ?? "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={`tracking-tight flex items-center gap-1.5 text-foreground no-underline ${
                  config.brand.className ?? "text-lg font-black"
                }`}
              >
                {config.brand.logo && <span className="inline-block shrink-0">{config.brand.logo}</span>}
                <span>{resolveBrandTitle()}</span>
                {config.brand.showAccentDot !== false && (
                  <span className="inline-block w-2 h-2 bg-[#F04104] rounded-xs shrink-0"></span>
                )}
              </NavLink>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {headerLinks.length > 0 && (
              <div className="flex flex-col gap-1 pb-3 border-b border-border">
                {headerLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target={link.external !== false ? "_blank" : undefined}
                    rel={link.external !== false ? "noopener noreferrer" : undefined}
                    className="px-2.5 py-1.5 rounded-md text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-colors no-underline"
                  >
                    {typeof link.label === "object"
                      ? link.label[lang] ?? link.label["ru"] ?? link.label["en"] ?? ""
                      : link.label}
                  </a>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1">
              {config.categories && config.categories.length > 0 ? (
                config.categories.map((cat, idx) => {
                  const pages = filterCategoryPages(cat);
                  if (pages.length === 0) return null;
                  const label = resolveCategoryLabel(cat);
                  return (
                    <div
                      key={cat.id ?? idx}
                      className="mt-6 first:mt-0 pt-4 first:pt-0 border-t first:border-t-0 border-border/40"
                    >
                      <div className="px-2.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 select-none">
                        {label}
                      </div>
                      <ul className="space-y-0.5">
                        {pages.map((page) => (
                          <SectionItem
                            key={page.slug}
                            page={page}
                            open={openSections.has(page.slug)}
                            onToggle={() => toggleSection(page.slug)}
                            subSections={subSectionMap.get(page.slug)}
                            openSections={openSections}
                            onToggleSection={toggleSection}
                            openLectures={openLectures}
                            onToggleLecture={toggleLecture}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })
              ) : (
                <ul className="space-y-0.5">
                  {wikiSections
                    .filter((p) => !childSlugs.has(p.slug))
                    .map((page) => (
                      <SectionItem
                        key={page.slug}
                        page={page}
                        open={openSections.has(page.slug)}
                        onToggle={() => toggleSection(page.slug)}
                        subSections={subSectionMap.get(page.slug)}
                        openSections={openSections}
                        onToggleSection={toggleSection}
                        openLectures={openLectures}
                        onToggleLecture={toggleLecture}
                      />
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {config.enableSearch !== false && (
        <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
      <CookieConsent />
    </div>
  );
}
export default WikiLayout;
