import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Globe } from "lucide-react";
import { parseYouTubeUrl } from "./YouTubeEmbed";

interface MicrolinkData {
  title: string;
  image: string | null;
  logo: string | null;
}

const CACHE_PREFIX = "ml_v1_";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function getCached(url: string): MicrolinkData | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + url);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: MicrolinkData; expires: number };
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(CACHE_PREFIX + url);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(url: string, data: MicrolinkData) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_PREFIX + url,
      JSON.stringify({ data, expires: Date.now() + CACHE_TTL }),
    );
  } catch {
    /* ignore quota errors */
  }
}

async function fetchPreview(url: string): Promise<MicrolinkData> {
  const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}`);
  const json = (await res.json()) as {
    data?: { title?: string; image?: { url?: string }; logo?: { url?: string } };
  };
  const d = json.data ?? {};
  return { title: d.title ?? "", image: d.image?.url ?? null, logo: d.logo?.url ?? null };
}

function getFaviconUrls(url: string): string[] {
  try {
    const { hostname, origin } = new URL(url);
    return [
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
      `${origin}/favicon.ico`,
    ];
  } catch {
    return [];
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function extractDocUrls(content: string): Set<string> {
  const urls = new Set<string>();
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*(?:[-*]\s+)?\[[^\]]*\]\((https?:\/\/[^)]+)\)\s*$/);
    if (match && !parseYouTubeUrl(match[1])) {
      urls.add(match[1]);
    }
  }
  return urls;
}

export function DocLinkCard({ href, children }: { href: string; children: ReactNode }) {
  const domain = getDomain(href);
  const explicitTitle = typeof children === "string" ? children.trim() : "";
  const isGeneric = !explicitTitle || explicitTitle === href || explicitTitle === domain;

  const [data, setData] = useState<MicrolinkData | null>(() => getCached(href));
  const [faviconIndex, setFaviconIndex] = useState(0);
  const [iconFailed, setIconFailed] = useState(false);

  useEffect(() => {
    // Only fetch microlink if we don't already have an explicit title and have no cached data
    if (!isGeneric || data !== null) return;
    fetchPreview(href)
      .then((d) => {
        setData(d);
        setCache(href, d);
      })
      .catch(() => {
        // Silently ignore rate limits or errors
      });
  }, [href, isGeneric, data]);

  const faviconUrls = getFaviconUrls(href);
  const currentFavicon = faviconUrls[faviconIndex] ?? null;
  const title = (!isGeneric ? explicitTitle : data?.title) || domain;

  const handleFaviconError = () => {
    if (faviconIndex + 1 < faviconUrls.length) {
      setFaviconIndex((i) => i + 1);
    } else {
      setIconFailed(true);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="my-2 flex items-center gap-3.5 px-4 py-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 hover:border-border transition-all duration-150 no-underline group not-prose"
    >
      <div className="shrink-0 w-8 h-8 rounded-md bg-muted/60 border border-border/40 flex items-center justify-center overflow-hidden">
        {!iconFailed && currentFavicon ? (
          <img
            key={currentFavicon}
            src={currentFavicon}
            alt=""
            loading="lazy"
            className="w-5 h-5 object-contain m-0 not-prose"
            onError={handleFaviconError}
          />
        ) : (
          <Globe className="w-4 h-4 text-muted-foreground/60" />
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {title}
        </div>
        <div className="text-xs text-muted-foreground/70 uppercase tracking-wide truncate mt-0.5 font-mono">
          {domain}
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all"
      />
    </a>
  );
}
