import { useContext } from "react";
import { ListVideo, ExternalLink } from "lucide-react";
import { WikiContext } from "../context/WikiContext";

export interface YouTubeParsed {
  type: "video" | "playlist";
  id: string;
  embedUrl: string;
  playlistId?: string;
}

export function parseYouTubeUrl(url: string): YouTubeParsed | null {
  try {
    const u = new URL(url);
    // youtu.be/<id>
    if (u.hostname === "youtu.be" || u.hostname.endsWith(".youtu.be")) {
      const id = u.pathname.slice(1).split("/")[0].split("?")[0];
      const list = u.searchParams.get("list") || undefined;
      if (id) {
        return {
          type: "video",
          id,
          embedUrl: list
            ? `https://www.youtube-nocookie.com/embed/${id}?list=${list}`
            : `https://www.youtube-nocookie.com/embed/${id}`,
          playlistId: list,
        };
      }
    }
    // youtube.com
    if (u.hostname === "youtube.com" || u.hostname.endsWith(".youtube.com")) {
      const list = u.searchParams.get("list") || undefined;
      const v = u.searchParams.get("v");

      if (v) {
        const embedUrl = list
          ? `https://www.youtube-nocookie.com/embed/${v}?list=${list}`
          : `https://www.youtube-nocookie.com/embed/${v}`;
        return { type: "video", id: v, embedUrl, playlistId: list };
      }
      if (list) {
        return {
          type: "playlist",
          id: list,
          embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`,
          playlistId: list,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export interface YouTubeEmbedProps {
  embedUrl: string;
  title?: string;
  playlistId?: string;
}

export function YouTubeEmbed({
  embedUrl,
  title = "YouTube video player",
  playlistId,
}: YouTubeEmbedProps) {
  const wiki = useContext(WikiContext);
  const lang = wiki?.lang ?? "ru";

  const playlistUrl = playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : null;
  const playlistLabel = lang === "ru" ? "Открыть плейлист на YouTube" : "Open playlist on YouTube";

  return (
    <span className="block my-6 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm not-prose">
      <span className="block w-full aspect-video bg-black">
        <iframe
          className="w-full h-full border-0 block"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </span>
      {playlistUrl && (
        <a
          href={playlistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-4 py-2.5 bg-accent/30 hover:bg-accent/70 border-t border-border/80 text-xs text-muted-foreground hover:text-foreground transition-all duration-150 no-underline group"
        >
          <span className="flex items-center gap-2">
            <ListVideo className="w-4 h-4 text-primary group-hover:scale-105 transition-transform" />
            <span className="font-medium text-foreground/90 group-hover:text-foreground">
              {playlistLabel}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-xs opacity-70 group-hover:opacity-100 transition-opacity">
            <span className="font-mono text-[11px] tracking-wide">YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </a>
      )}
    </span>
  );
}
