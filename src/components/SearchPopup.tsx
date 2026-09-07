import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, BookOpen, CornerDownLeft, X } from "lucide-react";
import { useWiki } from "../context/WikiContext";

interface SearchItem {
  id: string;
  type: "section" | "lecture";
  title: string;
  titleEn: string;
  subtitle?: string;
  path: string;
  content: string;
  contentEn: string;
}

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

function getSnippet(text: string, query: string): string {
  const cleanText = text
    .replace(/#+\s+/g, "") // remove header markup
    .replace(/[*_`]/g, "") // remove bold/italic/inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // remove links
    .replace(/\s+/g, " "); // normalize whitespace

  const idx = cleanText.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return "";

  const start = Math.max(0, idx - 40);
  const end = Math.min(cleanText.length, idx + query.length + 40);
  let snippet = cleanText.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < cleanText.length) snippet = snippet + "...";
  return snippet;
}

export function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { data, lang } = useWiki();
  const { wikiIndex, wikiSections } = data;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 1. Index pages
  const searchItems = useMemo(() => {
    const items: SearchItem[] = [];

    // Add README (Intro)
    if (wikiIndex) {
      items.push({
        id: "readme",
        type: "section",
        title: wikiIndex.title,
        titleEn: wikiIndex.titleEn,
        path: `/wiki/${wikiIndex.slug}`,
        content: wikiIndex.content,
        contentEn: wikiIndex.contentEn ?? "",
      });
    }

    // Add sections and their lectures
    for (const section of wikiSections) {
      items.push({
        id: section.slug,
        type: "section",
        title: section.title,
        titleEn: section.titleEn,
        path: `/wiki/${section.slug}`,
        content: section.content,
        contentEn: section.contentEn ?? "",
      });

      for (const lecture of section.lectures) {
        const key = `${section.slug}/${lecture.number}`;
        if (lecture.page) {
          items.push({
            id: key,
            type: "lecture",
            title: lecture.page.title,
            titleEn: lecture.page.titleEn,
            subtitle: section.title,
            path: `/wiki/${section.slug}/${lecture.page.slug}`,
            content: lecture.page.content,
            contentEn: lecture.page.contentEn ?? "",
          });
        } else {
          items.push({
            id: key,
            type: "lecture",
            title: lecture.title,
            titleEn: lecture.titleEn,
            subtitle: section.title,
            path: `/wiki/${section.slug}#${lecture.anchorSlug}`,
            content: "",
            contentEn: "",
          });
        }
      }
    }

    return items;
  }, [wikiIndex, wikiSections]);

  // 2. Filter items based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return searchItems
        .filter((item) => item.type === "section")
        .slice(0, 6)
        .map((item) => ({ item, snippet: "" }));
    }

    const keywords = query.toLowerCase().trim().split(/\s+/);

    return searchItems
      .map((item) => {
        let score = 0;
        const itemTitle = (lang === "en" && item.titleEn ? item.titleEn : item.title) || item.title;
        const otherTitle = (lang === "en" ? item.title : item.titleEn) || "";
        const itemSubtitle = item.subtitle ?? "";
        const itemContent =
          (lang === "en" && item.contentEn ? item.contentEn : item.content) || item.content;

        const titleLower = itemTitle.toLowerCase();
        const otherTitleLower = otherTitle.toLowerCase();
        const subtitleLower = itemSubtitle.toLowerCase();
        const contentLower = itemContent.toLowerCase();

        const matchesAll = keywords.every(
          (kw) =>
            titleLower.includes(kw) ||
            otherTitleLower.includes(kw) ||
            subtitleLower.includes(kw) ||
            contentLower.includes(kw),
        );

        if (!matchesAll) return null;

        const queryLower = query.toLowerCase().trim();
        if (titleLower === queryLower) {
          score += 100;
        } else if (titleLower.startsWith(queryLower)) {
          score += 50;
        } else if (titleLower.includes(queryLower)) {
          score += 30;
        }

        if (otherTitleLower.includes(queryLower)) {
          score += 20;
        }

        if (subtitleLower.includes(queryLower)) {
          score += 15;
        }

        let snippet = "";
        if (contentLower.includes(queryLower)) {
          score += 10;
          snippet = getSnippet(itemContent, queryLower);
        } else {
          for (const kw of keywords) {
            if (contentLower.includes(kw)) {
              snippet = getSnippet(itemContent, kw);
              break;
            }
          }
        }

        return { item, score, snippet };
      })
      .filter((res): res is { item: SearchItem; score: number; snippet: string } => res !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [searchItems, query, lang]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          navigate(filteredResults[selectedIndex].item.path);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, navigate, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="w-full max-w-2xl bg-background border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border gap-3 text-muted-foreground">
          <Search size={18} className="shrink-0 text-muted-foreground/60" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-base focus:outline-none"
            placeholder={lang === "en" ? "Search course materials..." : "Поиск по материалам курса..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-accent rounded text-muted-foreground/60 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent border border-border text-muted-foreground select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {lang === "en" ? "No results found." : "Ничего не найдено."}
            </div>
          ) : (
            filteredResults.map(({ item, snippet }, idx) => {
              const isSelected = idx === selectedIndex;
              const displayTitle =
                lang === "en" && item.titleEn ? item.titleEn : item.title;

              return (
                <div
                  key={item.id + idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className={`flex flex-col p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.type === "section" ? (
                      <BookOpen
                        size={16}
                        className={`shrink-0 ${isSelected ? "text-foreground" : "text-muted-foreground/60"}`}
                      />
                    ) : (
                      <FileText
                        size={16}
                        className={`shrink-0 ${isSelected ? "text-foreground" : "text-muted-foreground/60"}`}
                      />
                    )}
                    <span className="font-medium text-foreground text-sm flex-1 truncate">
                      {displayTitle}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground/50 border border-border px-1.5 py-0.5 rounded">
                        {item.subtitle}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={14} className="text-muted-foreground/40 shrink-0" />
                    )}
                  </div>

                  {snippet && (
                    <div className="mt-1 pl-6 text-xs text-muted-foreground line-clamp-1 break-all">
                      {snippet}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-accent/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground select-none">
          <div className="flex gap-4">
            <span>
              <kbd className="font-mono bg-accent px-1 rounded border border-border">↑</kbd>
              <kbd className="font-mono bg-accent px-1 rounded border border-border ml-1">↓</kbd>{" "}
              {lang === "en" ? "navigate" : "навигация"}
            </span>
            <span>
              <kbd className="font-mono bg-accent px-1.5 rounded border border-border">↵</kbd>{" "}
              {lang === "en" ? "open" : "открыть"}
            </span>
          </div>
          <span>
            <kbd className="font-mono bg-accent px-1.5 rounded border border-border">esc</kbd>{" "}
            {lang === "en" ? "close" : "закрыть"}
          </span>
        </div>
      </div>
    </div>
  );
}
export default SearchPopup;
