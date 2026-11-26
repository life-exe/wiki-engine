import { useEffect, useRef, useState, type RefObject } from "react";
import { useWiki } from "../context/WikiContext";

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface TableOfContentsProps {
  containerRef: RefObject<HTMLElement | null>;
  contentKey: string;
}

function extractHeadingText(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-toc-ignore]").forEach((node) => node.remove());
  return (clone.textContent ?? "").trim();
}

function collectHeadings(container: HTMLElement): TocHeading[] {
  const elements = Array.from(container.querySelectorAll<HTMLElement>("h2[id], h3[id]"));
  const seen = new Map<string, number>();
  const items: TocHeading[] = [];

  for (const el of elements) {
    const baseId = el.id;
    if (!baseId) continue;

    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);

    const uniqueId = count === 0 ? baseId : `${baseId}-${count}`;
    if (el.id !== uniqueId) {
      el.id = uniqueId;
      const anchor = el.querySelector<HTMLAnchorElement>("a[data-toc-ignore]");
      if (anchor) anchor.href = `#${uniqueId}`;
    }

    const text = extractHeadingText(el);
    if (!text) continue;

    items.push({
      id: uniqueId,
      text,
      level: el.tagName === "H2" ? 2 : 3,
    });
  }

  return items;
}

export function TableOfContents({ containerRef, contentKey }: TableOfContentsProps) {
  const { config, lang } = useWiki();
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const scrollLockedRef = useRef(false);
  const scrollUnlockTimerRef = useRef<number | null>(null);

  const enabled = config.enableToc !== false;

  useEffect(() => {
    if (!enabled) return;

    const frameId = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;
      const items = collectHeadings(container);
      setHeadings(items);
      setActiveId(items[0]?.id ?? "");
    });

    return () => cancelAnimationFrame(frameId);
  }, [containerRef, contentKey, enabled]);

  useEffect(() => {
    if (!enabled || headings.length < 2) return;

    const container = containerRef.current;
    if (!container) return;

    const scrollParent = container.closest("main");
    if (!scrollParent) return;

    let rafId = 0;

    const updateActive = () => {
      const parentRect = scrollParent.getBoundingClientRect();
      const threshold = parentRect.top + 100;

      const atBottom =
        scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight < 24;
      if (atBottom) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }

      let current = headings[0].id;
      for (const item of headings) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= threshold) {
          current = item.id;
        } else {
          break;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (scrollLockedRef.current) return;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActive);
    };

    const onScrollEnd = () => {
      scrollLockedRef.current = false;
      if (scrollUnlockTimerRef.current !== null) {
        window.clearTimeout(scrollUnlockTimerRef.current);
        scrollUnlockTimerRef.current = null;
      }
    };

    rafId = requestAnimationFrame(updateActive);
    scrollParent.addEventListener("scroll", onScroll, { passive: true });
    scrollParent.addEventListener("scrollend", onScrollEnd, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      scrollParent.removeEventListener("scroll", onScroll);
      scrollParent.removeEventListener("scrollend", onScrollEnd);
    };
  }, [containerRef, headings, enabled]);

  if (!enabled || headings.length < 2) return null;

  const title = lang === "en" ? "On this page" : "На этой странице";

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      scrollLockedRef.current = true;
      if (scrollUnlockTimerRef.current !== null) {
        window.clearTimeout(scrollUnlockTimerRef.current);
      }
      scrollUnlockTimerRef.current = window.setTimeout(() => {
        scrollLockedRef.current = false;
        scrollUnlockTimerRef.current = null;
      }, 800);
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside aria-label={title} className="hidden xl:block w-56 shrink-0">
      <nav className="sticky top-10 max-h-[calc(100vh-7.5rem)] overflow-y-auto overflow-x-hidden pr-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <ul className="space-y-1 border-l border-border text-sm">
          {headings.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`block border-l-2 -ml-px py-1 transition-colors leading-snug no-underline [overflow-wrap:anywhere] ${
                    item.level === 3 ? "pl-6 text-[13px]" : "pl-3"
                  } ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
