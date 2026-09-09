import { useEffect, useState, type ReactNode, useContext } from "react";
import { ChevronRight, ListVideo } from "lucide-react";
import { WikiContext } from "../context/WikiContext";

interface PlaylistOEmbed {
  title?: string;
  author_name?: string;
}

const CACHE_PREFIX = "yt_pl_";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCached(playlistId: string): PlaylistOEmbed | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + playlistId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: PlaylistOEmbed; expires: number };
    if (Date.now() > parsed.expires) {
      localStorage.removeItem(CACHE_PREFIX + playlistId);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(playlistId: string, data: PlaylistOEmbed) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_PREFIX + playlistId,
      JSON.stringify({ data, expires: Date.now() + CACHE_TTL })
    );
  } catch {
    /* ignore quota */
  }
}

export interface YouTubePlaylistCardProps {
  url: string;
  playlistId: string;
  title?: string;
  children?: ReactNode;
}

export function YouTubePlaylistCard({
  url,
  playlistId,
  title: propTitle,
  children,
}: YouTubePlaylistCardProps) {
  const wiki = useContext(WikiContext);
  const lang = wiki?.lang ?? "ru";

  const rawText =
    propTitle || (typeof children === "string" ? children.trim() : "");
  const isGeneric =
    !rawText || rawText === url || rawText.includes("youtube.com") || rawText.includes("youtu.be");

  const [data, setData] = useState<PlaylistOEmbed | null>(() => getCached(playlistId));

  useEffect(() => {
    if (data !== null) return;
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    fetch(oembedUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PlaylistOEmbed | null) => {
        if (json && json.title) {
          setData(json);
          setCache(playlistId, json);
        }
      })
      .catch(() => {
        /* ignore network errors */
      });
  }, [url, playlistId, data]);

  const defaultLabel = lang === "ru" ? "Плейлист на YouTube" : "YouTube Playlist";
  const displayTitle = (!isGeneric ? rawText : data?.title) || defaultLabel;
  const playlistHref = `https://www.youtube.com/playlist?list=${playlistId}`;

  return (
    <a
      href={playlistHref}
      target="_blank"
      rel="noopener noreferrer"
      className="my-3 flex items-center gap-3.5 px-4 py-3 rounded-lg border border-border/80 bg-card hover:bg-muted/40 hover:border-border transition-all duration-150 no-underline group not-prose"
    >
      <div className="shrink-0 w-8 h-8 rounded-md bg-red-600/10 dark:bg-red-500/15 border border-red-600/20 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform overflow-hidden">
        <ListVideo className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {displayTitle}
        </div>
        <div className="text-xs text-muted-foreground/70 uppercase tracking-wide truncate mt-0.5 font-mono">
          youtube.com / playlist
        </div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all"
      />
    </a>
  );
}
