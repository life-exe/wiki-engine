import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react";
import type { WikiConfig, WikiData } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme, type Theme } from "../hooks/useTheme";
import { LangContext } from "./LangContext";
import { normalizeBasePath, getWikiPath } from "../utils/url";

export interface WikiContextValue {
  config: WikiConfig;
  data: WikiData;
  lang: string;
  setLang: (lang: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  basePath: string;
  getWikiUrl: (subpath: string) => string;
}

export const WikiContext = createContext<WikiContextValue | null>(null);

export function useWiki(): WikiContextValue {
  const ctx = useContext(WikiContext);
  if (!ctx) {
    throw new Error("useWiki must be used within a WikiProvider");
  }
  return ctx;
}

export function WikiProvider({
  config,
  data,
  children,
}: {
  config: WikiConfig;
  data: WikiData;
  children: ReactNode;
}) {
  const { lang, setLang } = useLanguage(config.defaultLanguage ?? "ru");
  const { theme, toggle: toggleTheme } = useTheme();

  const basePath = useMemo(() => normalizeBasePath(config.basePath), [config.basePath]);
  const getWikiUrl = useCallback((subpath: string) => getWikiPath(basePath, subpath), [basePath]);

  return (
    <WikiContext.Provider
      value={{ config, data, lang, setLang, theme, toggleTheme, basePath, getWikiUrl }}
    >
      <LangContext.Provider value={lang}>{children}</LangContext.Provider>
    </WikiContext.Provider>
  );
}
