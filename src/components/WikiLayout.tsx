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
} from "lucide-react";
import type { WikiPage, WikiCategoryConfig, Lecture } from "../types";
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
      <div className="flex items-center gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => lectureKey && onToggleLecture(lectureKey)}
            className="flex items-center justify-center w-5 h-5 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            <ChevronRight
              size={13}
              className={`transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
            />
          </button>
        ) : depth > 0 ? (
          <span className="w-3 h-5 shrink-0" />
        ) : null}
        <NavLink
          to={
            lecture.page
              ? `/wiki/${sectionSlug}/${lecture.page.slug}`
              : `/wiki/${sectionSlug}#${lecture.anchorSlug}`
          }
          onClick={
            hasChildren && lectureKey
              ? () => {
                  if (!isOpen) onToggleLecture(lectureKey);
                }
              : undefined
          }
          className={({ isActive }) =>
            `flex-1 px-2 py-1 rounded text-sm transition-colors truncate focus:outline-none ${
              isActive || isSelfActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            } ${lecture.page ? "" : "opacity-60"}`
          }
        >
          {lTitle}
        </NavLink>
      </div>

      {hasChildren && isOpen && (
        <ul className="ml-4 border-l border-border pl-2 mt-0.5 space-y-0.5">
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
  const isActive = slug === page.slug || section === page.slug;
  const { lang } = useWiki();
  const title = lang === "en" && page.titleEn ? page.titleEn : page.title;
  const hasChildren = page.lectures.length > 0 || subSections.length > 0;

  const textSize = depth === 0 ? "text-base" : "text-sm";
  const isExactPage =
    location.pathname.replace(/\/+$/, "") === `/wiki/${page.slug}` && !location.hash;

  return (
    <li>
      <div className="flex items-center gap-0.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center w-5 h-5 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          >
            <ChevronRight
              size={14}
              className={`transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}
        <NavLink
          to={`/wiki/${page.slug}`}
          onClick={
            hasChildren
              ? (e) => {
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
                }
              : undefined
          }
          className={`flex-1 px-2 py-1 rounded ${textSize} truncate transition-colors focus:outline-none ${
            isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {title}
        </NavLink>
      </div>

      {open && hasChildren && (
        <ul className="ml-5 border-l border-border pl-2 mt-0.5 space-y-0.5">
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
  const [searchOpen, setSearchOpen] = useState(false);
  const prevWidth = useRef(420);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        style={{ width: collapsed ? 40 : sidebarWidth }}
        className="shrink-0 sticky top-0 h-screen flex flex-col transition-[width] duration-200 overflow-hidden"
      >
        <div className="px-3 pt-3 pb-2 border-b border-border flex items-center gap-2 min-w-0">
          {!collapsed && (
            <NavLink
              to={config.brand.homeLink ?? "/"}
              className="text-sm font-semibold hover:text-foreground text-foreground/80 transition-colors flex-1 truncate"
            >
              {config.brand.logo && <span className="mr-2 inline-block">{config.brand.logo}</span>}
              {resolveBrandTitle()}
            </NavLink>
          )}
          <button
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                setSidebarWidth(prevWidth.current);
              } else {
                prevWidth.current = sidebarWidth;
                setCollapsed(true);
              }
            }}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {config.enableSearch !== false && (
          !collapsed ? (
            <div className="px-3 py-2 border-b border-border">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded border border-border bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm text-left cursor-pointer focus:outline-none"
              >
                <Search size={14} className="shrink-0" />
                <span className="flex-1 truncate">{lang === "en" ? "Search..." : "Поиск..."}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent border border-border shrink-0 select-none">
                  Ctrl+K
                </kbd>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2 border-b border-border">
              <button
                onClick={() => setSearchOpen(true)}
                title={lang === "en" ? "Search (Ctrl+K)" : "Поиск (Ctrl+K)"}
                className="flex items-center justify-center w-6 h-6 rounded cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none"
              >
                <Search size={14} />
              </button>
            </div>
          )
        )}

        <div
          className="px-3 py-1.5 border-b border-border flex items-center gap-1"
          style={{ display: collapsed ? "none" : undefined }}
        >
          <button
            onClick={expandAll}
            title={lang === "en" ? "Expand all" : "Развернуть все"}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronsDown size={13} /> {lang === "en" ? "Expand" : "Развернуть"}
          </button>
          <button
            onClick={collapseAll}
            title={lang === "en" ? "Collapse all" : "Свернуть все"}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronsUp size={13} /> {lang === "en" ? "Collapse" : "Свернуть"}
          </button>
        </div>

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
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
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

        <div
          className="px-3 py-2 border-t border-border flex items-center gap-1"
          style={{ display: collapsed ? "none" : undefined }}
        >
          {config.enableThemeToggle !== false && (
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 flex-1 px-2 py-1.5 rounded cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              {theme === "dark"
                ? lang === "en"
                  ? "Light"
                  : "Светлая"
                : lang === "en"
                  ? "Dark"
                  : "Тёмная"}
            </button>
          )}

          {showLangToggle && (
            <div className="flex rounded overflow-hidden border border-border text-xs font-medium shrink-0">
              {supportedLanguages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors uppercase ${
                    lang === l
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {!collapsed && (
        <div
          onMouseDown={onMouseDown}
          className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-accent-foreground/20 transition-colors"
        />
      )}

      <main ref={mainRef} className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {config.enableSearch !== false && (
        <SearchPopup isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
      <CookieConsent />
    </div>
  );
}
export default WikiLayout;
