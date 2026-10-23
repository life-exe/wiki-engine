import { BookOpen } from "lucide-react";
import { useWiki } from "../../context/WikiContext";

type Localized = string | { [lang: string]: string | undefined };

/** Picks the current language, falling back to ru, then en. */
function localize(value: Localized, lang: string): string | undefined {
  return typeof value === "object" ? (value[lang] ?? value["ru"] ?? value["en"]) : value;
}

/** "© year · tagline · Powered by" footer, configured via `config.poweredBy`. */
export function WikiFooter() {
  const { config, lang } = useWiki();

  const poweredByConfig = typeof config.poweredBy === "object" ? config.poweredBy : undefined;
  const poweredByUrl = poweredByConfig?.url ?? "https://github.com/life-exe/wiki-engine";
  const poweredByPrefix = poweredByConfig?.prefix
    ? (localize(poweredByConfig.prefix, lang) ?? "Powered by")
    : "Powered by";
  const poweredByText = poweredByConfig?.text
    ? (localize(poweredByConfig.text, lang) ?? "life-exe wiki engine")
    : "life-exe wiki engine";

  const currentYear = new Date().getFullYear();
  const defaultTagline =
    lang === "ru"
      ? "Все права защищены, все коммиты запушены"
      : "All rights reserved, all commits pushed";

  const poweredByTagline =
    poweredByConfig?.tagline !== undefined
      ? localize(poweredByConfig.tagline, lang)
      : defaultTagline;
  const poweredByCopyright =
    poweredByConfig?.copyright !== undefined
      ? localize(poweredByConfig.copyright, lang)
      : undefined;
  const copyrightUrl =
    poweredByConfig?.copyrightUrl !== undefined
      ? poweredByConfig.copyrightUrl
      : "https://www.life-exe.com";

  return (
    <footer className="mt-auto shrink-0">
      <div className="max-w-4xl mx-auto px-8">
        <div className="border-t border-border/40 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground select-none">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left">
            {poweredByCopyright !== "" && (
              <span className="font-normal text-muted-foreground/80 flex items-center gap-1">
                <span>© {currentYear}</span>
                {copyrightUrl ? (
                  <a
                    href={copyrightUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground/90 hover:text-primary transition-colors no-underline inline-flex items-center gap-1 group"
                  >
                    <span>{poweredByCopyright ?? "LIFE.EXE"}</span>
                    {poweredByCopyright === undefined && (
                      <span className="inline-block w-1.5 h-1.5 bg-[#F04104] rounded-xs ml-0.5 group-hover:scale-110 transition-transform" />
                    )}
                  </a>
                ) : (
                  <>
                    <span className="font-semibold text-foreground/90">
                      {poweredByCopyright ?? "LIFE.EXE"}
                    </span>
                    {poweredByCopyright === undefined && (
                      <span className="inline-block w-1.5 h-1.5 bg-[#F04104] rounded-xs ml-0.5" />
                    )}
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
}
