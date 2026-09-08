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
import { SearchPopup } from "./SearchPopup";
import { CookieConsent } from "./CookieConsent";

function LectureItem({
  lecture,
  sectionSlug,
  openLectures,
  onToggleLecture,
  depth = 0,
}: {
  lecture: Lecture;
  sectionSlug: string;
  openLectures: Set<string>;
  onToggleLecture: (key: string) => void;
  depth?: number;
}) {
  const { lang } = useWiki();
  const { lecture: activeLecture } = useParams<{ lecture: string }>();
  const lTitle = lang === "en" && lecture.titleEn ? lecture.titleEn : lecture.title;
  const hasChildren = Boolean(lecture.children && lecture.children.length > 0);
  const lectureKey = lecture.page ? `${sectionSlug}/${lecture.page.slug}` : "";
  const isOpen = lectureKey ? openLectures.has(lectureKey) : false;

  const isSelfActive =
    lecture.page &&
    (activeLecture === lecture.page.slug || activeLecture === lecture.number);

  return (
    <li>
      {hasChildren ? (
        <div
          className={`group flex items-center justify-between w-full rounded-md transition-colors duration-150 ${
            isSelfActive
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
          }`}
        >
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
              isSelfActive ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"
            } ${lecture.page ? "" : "opacity-60"}`}
          >
            {lTitle}
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
          className={({ isActive }) =>
            `flex items-center w-full px-2.5 py-1.5 rounded-md text-sm transition-colors duration-150 truncate focus:outline-none ${
              isActive || isSelfActive
                ? "bg-accent text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
            } ${lecture.page ? "" : "opacity-60"}`
          }
        >
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

  return (
    <li>
      {hasChildren ? (
        <div
          className={`group flex items-center justify-between w-full rounded-md transition-colors duration-150 ${
            isActive && isExactPage
              ? "bg-accent text-foreground font-medium"
              : isActive
                ? "text-primary font-medium hover:bg-accent/80"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
          }`}
        >
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
              isActive && !isExactPage ? "text-primary" : ""
            }`}
          >
            {title}
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
          className={`flex items-center w-full px-2.5 py-1.5 rounded-md ${textSize} truncate transition-colors duration-150 focus:outline-none ${
            isActive
              ? "bg-accent text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
          }`}
        >
          {title}
        </NavLink>
      )}

      {open && hasChildren && (
        <ul className="ml-3.5 border-l border-border pl-1.5 mt-0.5 space-y-0.5">
          {page.lectures.map((lecture) => (
            <LectureItem
              key={lecture.anchorSlug}
              lecture={lecture}
              sectionSlug={page.slug}
              openLectures={openLectures}
              onToggleLecture={onToggleLecture}
            />
          ))}
          {subSections.map((sub) => (
            <SectionItem
              key={sub.slug}
              page={sub}
              open={openSections.has(sub.slug)}
              onToggle={() => onToggleSection(sub.slug)}
              subSections={[]}
              openSections={openSections}
              onToggleSection={onToggleSection}
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

  // Build parent → children map: a section is a child if its slug starts with parentSlug + "-"
  const childSlugs = new Set<string>();
  const subSectionMap = new Map<string, WikiPage[]>();
  for (const page of wikiSections) {
    for (const other of wikiSections) {
      if (other.slug !== page.slug && other.slug.startsWith(page.slug + "-")) {
        childSlugs.add(other.slug);
        const arr = subSectionMap.get(page.slug) ?? [];
        arr.push(other);
        subSectionMap.set(page.slug, arr);
      }
    }
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
                className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-1.5 text-foreground hover:opacity-90 transition-opacity no-underline shrink-0 whitespace-nowrap"
              >
                {config.brand.logo && <span className="inline-block shrink-0">{config.brand.logo}</span>}
                <span>{resolveBrandTitle()}</span>
                {config.brand.showAccentDot !== false && (
                  <span className="inline-block w-2 h-2 bg-[#F04104] rounded-xs shrink-0 mb-0.5"></span>
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
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm text-left cursor-pointer focus:outline-none min-w-[130px] sm:min-w-[170px] md:min-w-[200px]"
                  >
                    <Search size={14} className="shrink-0" />
                    <span className="flex-1 truncate text-xs sm:text-sm">
                      {lang === "en" ? "Search..." : "Поиск..."}
                    </span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent border border-border shrink-0 select-none">
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
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  title={lang === "en" ? "Expand all" : "Развернуть все"}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <ChevronsDown size={13} />
                  <span className="hidden sm:inline">{lang === "en" ? "Expand" : "Развернуть"}</span>
                </button>
                <button
                  onClick={collapseAll}
                  title={lang === "en" ? "Collapse all" : "Свернуть все"}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                >
                  <ChevronsUp size={13} />
                  <span className="hidden sm:inline">{lang === "en" ? "Collapse" : "Свернуть"}</span>
                </button>
              </div>
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
                  <div key={cat.id ?? idx} className="mb-3">
                    <div className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
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

          {/* Powered by Banner */}
          {poweredByEnabled && (
            <div
              className={`border-t border-border mt-auto shrink-0 ${
                collapsed ? "p-2 flex justify-center items-center" : "p-2.5"
              }`}
            >
              {collapsed ? (
                <a
                  href={poweredByUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${poweredByPrefix} ${poweredByText}`}
                  className="flex items-center justify-center w-8 h-8 shrink-0 aspect-square rounded-lg border border-border/80 bg-accent/20 hover:bg-accent/60 text-muted-foreground hover:text-foreground transition-all duration-150 no-underline"
                >
                  <BookOpen size={16} className="shrink-0" />
                </a>
              ) : (
                <a
                  href={poweredByUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border/80 bg-accent/20 hover:bg-accent/60 hover:border-border text-xs text-muted-foreground hover:text-foreground transition-all duration-150 no-underline shadow-2xs"
                >
                  <BookOpen
                    size={15}
                    className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                  <span className="truncate">
                    {poweredByPrefix}{" "}
                    <span className="font-semibold text-foreground">{poweredByText}</span>
                  </span>
                </a>
              )}
            </div>
          )}
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
          className={`flex-1 overflow-y-auto ${
            config.enableHeader !== false ? "h-[calc(100vh-3.5rem)]" : "h-screen"
          }`}
        >
          <Outlet />
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
                className="text-lg font-black tracking-tight flex items-center gap-1.5 text-foreground no-underline"
              >
                {config.brand.logo && <span className="inline-block shrink-0">{config.brand.logo}</span>}
                <span>{resolveBrandTitle()}</span>
                {config.brand.showAccentDot !== false && (
                  <span className="inline-block w-2 h-2 bg-[#F04104] rounded-xs shrink-0 mb-0.5"></span>
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
                    <div key={cat.id ?? idx} className="mb-3">
                      <div className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
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

            {poweredByEnabled && (
              <div className="pt-3 border-t border-border mt-auto shrink-0">
                <a
                  href={poweredByUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border/80 bg-accent/20 hover:bg-accent/60 hover:border-border text-xs text-muted-foreground hover:text-foreground transition-all duration-150 no-underline shadow-2xs"
                >
                  <BookOpen
                    size={15}
                    className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                  <span className="truncate">
                    {poweredByPrefix}{" "}
                    <span className="font-semibold text-foreground">{poweredByText}</span>
                  </span>
                </a>
              </div>
            )}
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
