import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
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
  const [data, setData] = useState<MicrolinkData | null>(() => getCached(href));
  const [loading, setLoading] = useState(() => getCached(href) === null);

  useEffect(() => {
    if (!loading) return;
    fetchPreview(href)
      .then((d) => {
        setData(d);
        setCache(href, d);
      })
      .catch(() => setData({ title: String(children), image: null, logo: null }))
      .finally(() => setLoading(false));
  }, [href, children, loading]);

  const domain = getDomain(href);
  const thumbnail = data?.image ?? data?.logo;
  const explicitTitle = typeof children === "string" ? children.trim() : "";
  const title = explicitTitle || data?.title || domain;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors no-underline group not-prose"
    >
      <div className="shrink-0 w-[72px] h-[54px] rounded overflow-hidden bg-muted flex items-center justify-center">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-muted-foreground/20" />
        ) : thumbnail ? (
          <img src={thumbnail} alt="" className="w-full h-full object-cover m-0 not-prose" />
        ) : (
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            {domain.slice(0, 3)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{domain}</div>
      </div>
      <ExternalLink
        size={14}
        className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
      />
    </a>
  );
}
