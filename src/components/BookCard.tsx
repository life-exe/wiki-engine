import { useState, type ReactNode } from "react";
import { BookOpen, User, ExternalLink, ShoppingBag, Globe } from "lucide-react";
import { useWiki } from "../hooks/useWiki";

export interface BookLink {
  label: string;
  url: string;
}

export interface BookCardProps {
  title?: string;
  author?: string;
  cover?: string;
  level?: string;
  description?: string;
  amazon?: string;
  ozon?: string;
  oreilly?: string;
  manning?: string;
  url?: string;
  urlLabel?: string;
  "url-label"?: string;
  urllabel?: string;
  links?: string | BookLink[];
  children?: ReactNode;

  // data-* attributes when rendered from markdown HTML block <div class="book-card" ...>
  "data-title"?: string;
  "data-author"?: string;
  "data-cover"?: string;
  "data-level"?: string;
  "data-description"?: string;
  "data-amazon"?: string;
  "data-ozon"?: string;
  "data-oreilly"?: string;
  "data-manning"?: string;
  "data-url"?: string;
  "data-url-label"?: string;
  "data-links"?: string;
}

function parseLinks(props: BookCardProps): BookLink[] {
  const result: BookLink[] = [];

  const amazon = props.amazon || props["data-amazon"];
  const ozon = props.ozon || props["data-ozon"];
  const oreilly = props.oreilly || props["data-oreilly"];
  const manning = props.manning || props["data-manning"];
  const url = props.url || props["data-url"];
  const rawLinks = props.links || props["data-links"];

  if (amazon) {
    result.push({ label: "Amazon", url: amazon });
  }
  if (ozon) {
    result.push({ label: "Ozon", url: ozon });
  }
  if (oreilly) {
    result.push({ label: "O'Reilly", url: oreilly });
  }
  if (manning) {
    result.push({ label: "Manning", url: manning });
  }
  if (url) {
    const label =
      props.urlLabel ||
      props["url-label"] ||
      props.urllabel ||
      props["data-url-label"] ||
      "Читать онлайн";
    result.push({ label, url });
  }

  if (rawLinks) {
    if (typeof rawLinks === "string") {
      try {
        const parsed = JSON.parse(rawLinks);
        if (Array.isArray(parsed)) {
          result.push(...parsed);
        }
      } catch {
        // Parse format like "Amazon: https://..., Ozon: https://..."
        const parts = rawLinks.split(/[,;]\s*/);
        for (const p of parts) {
          const match = p.match(/^([^:]+):\s*(https?:\/\/.+)$/);
          if (match) {
            result.push({ label: match[1].trim(), url: match[2].trim() });
          }
        }
      }
    } else if (Array.isArray(rawLinks)) {
      result.push(...rawLinks);
    }
  }

  return result;
}

function getLinkBadgeStyle(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("amazon")) {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-amber-500/25";
  }
  if (lower.includes("ozon")) {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/25";
  }
  if (lower.includes("reilly") || lower.includes("oreilly")) {
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/25";
  }
  if (lower.includes("manning")) {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/25";
  }
  return "bg-primary/10 text-primary hover:bg-primary/20 border-primary/25";
}

function getLinkIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("amazon") || lower.includes("ozon")) {
    return <ShoppingBag size={12} className="shrink-0" />;
  }
  if (lower.includes("reilly") || lower.includes("manning")) {
    return <BookOpen size={12} className="shrink-0" />;
  }
  return <Globe size={12} className="shrink-0" />;
}

export function BookCard(props: BookCardProps) {
  const wiki = useWiki();
  const title = props.title || props["data-title"] || "";
  const author = props.author || props["data-author"];
  const rawCover = props.cover || props["data-cover"];
  const level = props.level || props["data-level"];
  const description = props.description || props["data-description"];
  const { children } = props;
  const [imgError, setImgError] = useState(false);
  const links = parseLinks(props);

  let cover = rawCover;
  if (cover && !cover.startsWith("http") && !cover.startsWith("/") && wiki?.data?.wikiImages) {
    const cleanCover = cover.replace(/^\.\//, "");
    const found = Object.keys(wiki.data.wikiImages).find((p) => p.endsWith(cleanCover));
    if (found && wiki.data.wikiImages[found]) {
      cover = wiki.data.wikiImages[found];
    }
  }

  const hasStore = links.some((l) =>
    /amazon|ozon|oreilly|manning|labirint/i.test(l.label),
  );
  const hasRead = links.some((l) =>
    /читать|бесплатно|online|read|free/i.test(l.label),
  );
  const linksLabel =
    hasStore && hasRead
      ? "Купить / Читать:"
      : hasStore
      ? "Где купить:"
      : "Ссылки:";

  return (
    <div className="not-prose my-5 flex flex-col sm:flex-row gap-5 sm:gap-6 rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5 hover:bg-card hover:border-border transition-all duration-200 shadow-sm hover:shadow-md group">
      {/* Book Cover */}
      <div className="relative shrink-0 w-36 sm:w-44 md:w-48 aspect-[2/3] rounded-lg overflow-hidden border border-border/80 shadow-md bg-muted/40 flex items-center justify-center self-center sm:self-start">
        {cover && !imgError ? (
          <>
            <img
              src={cover}
              alt={title}
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
            />
            {/* Subtle spine shadow overlay */}
            <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center text-muted-foreground/60 h-full w-full bg-muted/30">
            <BookOpen size={32} className="mb-2 opacity-50" />
            <span className="text-xs font-medium line-clamp-3 leading-tight text-foreground/70">
              {title}
            </span>
          </div>
        )}
      </div>

      {/* Book Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-3">
        <div>
          {level && (
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded mb-1.5">
              {level}
            </span>
          )}
          <h4 className="text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors m-0">
            {title}
          </h4>
          {author && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium mt-1.5">
              <User size={14} className="shrink-0 text-muted-foreground/70" />
              <span>{author}</span>
            </div>
          )}
          {(description || children) && (
            <div className="text-xs sm:text-sm text-muted-foreground/90 mt-2 leading-relaxed">
              {description}
              {children}
            </div>
          )}
        </div>

        {/* Links / Buy buttons */}
        {links.length > 0 && (
          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2 mt-auto">
            <span className="text-xs text-muted-foreground/60 font-medium mr-1 select-none">
              {linksLabel}
            </span>
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all no-underline ${getLinkBadgeStyle(
                  link.label,
                )}`}
              >
                {getLinkIcon(link.label)}
                <span>{link.label}</span>
                <ExternalLink size={11} className="opacity-60 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookCard;
