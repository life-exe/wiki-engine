import { useState, useEffect } from "react";

export function useLanguage(defaultLang = "ru") {
  const [lang, setLang] = useState<string>(() => {
    return localStorage.getItem("wiki-lang") ?? defaultLang;
  });

  useEffect(() => {
    localStorage.setItem("wiki-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return { lang, setLang };
}
