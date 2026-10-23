import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Menu, Moon, Search, Sun, X } from "lucide-react";
import type { WikiConfig, WikiHeaderLink } from "../../types";
import { useWiki } from "../../context/WikiContext";

export function resolveHeaderLinks(config: WikiConfig): WikiHeaderLink[] {
  return (
    config.headerLinks ??
    config.socialLinks?.map((s) => ({
      label: s.name,
      url: s.url,
      external: true,
    })) ??
    []
  );
}

export function headerLinkLabel(link: WikiHeaderLink, lang: string): string {
  return typeof link.label === "object"
    ? (link.label[lang] ?? link.label["ru"] ?? link.label["en"] ?? "")
    : link.label;
}

/** Brand logo + title + accent dot linking to `brand.homeLink`. */
export function BrandLink({
  className,
  defaultSizeClassName,
  onClick,
}: {
  className: string;
  defaultSizeClassName: string;
  onClick?: () => void;
}) {
  const { config, lang } = useWiki();

  const resolveBrandTitle = (): ReactNode => {
    const raw = config.brand.title;
    if (typeof raw === "object" && raw !== null && ("ru" in raw || "en" in raw)) {
      const loc = raw as Record<string, ReactNode>;
      return loc[lang] ?? loc["ru"] ?? loc["en"] ?? "";
    }
    return raw as ReactNode;
  };

  return (
    <NavLink
      to={config.brand.homeLink ?? "/"}
      onClick={onClick}
      className={`${className} ${config.brand.className ?? defaultSizeClassName}`}
    >
      {config.brand.logo && <span className="inline-block shrink-0">{config.brand.logo}</span>}
      <span>{resolveBrandTitle()}</span>
      {config.brand.showAccentDot !== false && (
        <span className="inline-block w-2 h-2 bg-[#F04104] rounded-xs shrink-0"></span>
      )}
    </NavLink>
  );
}

interface WikiHeaderProps {
  isMobile: boolean;
  collapsed: boolean;
  sidebarWidth: number;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenSearch: () => void;
}

/** Sticky top bar: brand, header links, search, theme and language toggles. */
export function WikiHeader({
  isMobile,
  collapsed,
  sidebarWidth,
  mobileMenuOpen,
  onToggleMobileMenu,
  onOpenSearch,
}: WikiHeaderProps) {
  const { config, lang, setLang, theme, toggleTheme } = useWiki();

  const supportedLanguages = config.supportedLanguages ?? ["ru", "en"];
  const showLangToggle = supportedLanguages.length > 1;
  const headerLinks = resolveHeaderLinks(config);

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-border bg-background/95 backdrop-blur-sm flex items-center shrink-0 select-none relative">
      {/* Left: Mobile Menu Toggle + Brand Logo (matches sidebar width on desktop) */}
      <div
        style={{ width: isMobile ? undefined : collapsed ? 48 : sidebarWidth }}
        className="shrink-0 flex items-center px-4 transition-[width] duration-200"
      >
        <div
          className={`flex items-center gap-2 min-w-0 ${collapsed ? "absolute left-4 top-0 bottom-0 z-10" : ""}`}
        >
          <button
            onClick={onToggleMobileMenu}
            aria-label="Toggle menu"
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mr-1"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <BrandLink
            className="tracking-tight flex items-center gap-1.5 text-foreground hover:opacity-90 transition-opacity no-underline shrink-0 whitespace-nowrap"
            defaultSizeClassName="text-lg sm:text-xl font-black"
          />
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
                    {headerLinkLabel(link, lang)}
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
                onClick={onOpenSearch}
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
                title={
                  theme === "dark"
                    ? lang === "en"
                      ? "Light theme"
                      : "Светлая тема"
                    : lang === "en"
                      ? "Dark theme"
                      : "Тёмная тема"
                }
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
  );
}
