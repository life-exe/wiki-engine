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
}

export function YouTubeEmbed({
  embedUrl,
  title = "YouTube video player",
}: YouTubeEmbedProps) {
  return (
    <span className="block my-6 w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm aspect-video not-prose">
      <iframe
        className="w-full h-full border-0 block"
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </span>
  );
}
