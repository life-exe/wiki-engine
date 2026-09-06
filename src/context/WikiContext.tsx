import { createContext, useContext, type ReactNode } from "react";
import type { WikiConfig, WikiData } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme, type Theme } from "../hooks/useTheme";
import { LangContext } from "./LangContext";

export interface WikiContextValue {
  config: WikiConfig;
  data: WikiData;
  lang: string;
  setLang: (lang: string) => void;
  theme: Theme;
  toggleTheme: () => void;
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

  return (
    <WikiContext.Provider value={{ config, data, lang, setLang, theme, toggleTheme }}>
      <LangContext.Provider value={lang}>{children}</LangContext.Provider>
    </WikiContext.Provider>
  );
}
