import { useState, useRef, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, ChevronsDown, ChevronsUp, X } from "lucide-react";
import { useWiki } from "../context/WikiContext";
import { SearchPopup } from "./SearchPopup";
import { CookieConsent } from "./CookieConsent";
import { NavTree } from "./layout/NavTree";
import { useNavTree } from "./layout/useNavTree";
import { BrandLink, WikiHeader, headerLinkLabel, resolveHeaderLinks } from "./layout/WikiHeader";
import { WikiFooter } from "./layout/WikiFooter";

const MIN_WIDTH = 160;
const MAX_WIDTH = 600;

export function WikiLayout() {
  const { config, data, lang } = useWiki();
  const { wikiSections } = data;

  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
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

  const tree = useNavTree(wikiSections);
  const { isAllExpanded, toggleAll } = tree;

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

  const headerLinks = resolveHeaderLinks(config);

  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Top Header */}
      {config.enableHeader !== false && (
        <WikiHeader
          isMobile={isMobile}
          collapsed={collapsed}
          sidebarWidth={sidebarWidth}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSearch={() => setSearchOpen(true)}
        />
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
                    ? lang === "en"
                      ? "Collapse all"
                      : "Свернуть все"
                    : lang === "en"
                      ? "Expand all"
                      : "Развернуть все"
                }
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              >
                {isAllExpanded ? <ChevronsUp size={14} /> : <ChevronsDown size={14} />}
                <span>
                  {isAllExpanded
                    ? lang === "en"
                      ? "Collapse"
                      : "Свернуть"
                    : lang === "en"
                      ? "Expand"
                      : "Развернуть"}
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
                  ? lang === "en"
                    ? "Expand sidebar"
                    : "Развернуть панель"
                  : lang === "en"
                    ? "Collapse sidebar"
                    : "Свернуть панель"
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
            <NavTree tree={tree} />
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
          {config.poweredBy !== false && <WikiFooter />}
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
              <BrandLink
                className="tracking-tight flex items-center gap-1.5 text-foreground no-underline"
                defaultSizeClassName="text-lg font-black"
                onClick={() => setMobileMenuOpen(false)}
              />
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
                    {headerLinkLabel(link, lang)}
                  </a>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1">
              <NavTree tree={tree} />
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
