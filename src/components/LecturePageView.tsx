import { useMemo, useState, useEffect, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/vs2015.css";
import { common } from "lowlight";
import type { Element } from "hast";
import { useWiki } from "../context/WikiContext";
import { CodeBlockPre } from "./CodeBlock";
import { DocLinkCard, extractDocUrls } from "./DocLinkCard";
import { CommunityLinks } from "./CommunityLinks";
import { ZoomableImage } from "./ZoomableImage";
import { YouTubeEmbed, parseYouTubeUrl } from "./YouTubeEmbed";
import { BookCard } from "./BookCard";
import { CopyPageButton } from "./CopyPageButton";
import { Breadcrumbs } from "./Breadcrumbs";
import { processCalloutChildren } from "./Callout";

function toSlug(node: ReactNode): string {
  const text = (function extract(n: ReactNode): string {
    if (typeof n === "string") return n;
    if (Array.isArray(n)) return n.map(extract).join("");
    if (n && typeof n === "object" && "props" in (n as object))
      return extract(
        (n as ReactElement<{ children?: ReactNode }>).props.children,
      );
    return "";
  })(node);
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function Heading({ level, children, ...props }: ComponentProps<"h1"> & { level: 1 | 2 | 3 | 4 }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  const id = toSlug(children);
  const [copied, setCopied] = useState(false);

  const onCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    void navigator.clipboard.writeText(url).then(() => {
      window.history.replaceState(null, "", `#${id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <Tag id={id} className="group scroll-mt-6" {...props}>
      {children}
      <a
        href={`#${id}`}
        onClick={onCopy}
        aria-label="Copy link to this heading"
        className="ml-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-muted-foreground no-underline transition-opacity"
      >
        {copied ? "✓" : "#"}
      </a>
    </Tag>
  );
}

function nodeHasDocLink(node: Element, docUrls: Set<string>): boolean {
  for (const child of node.children) {
    if (child.type === "element") {
      if (child.tagName === "a") {
        const href = child.properties?.href;
        if (typeof href === "string" && docUrls.has(href)) return true;
      }
      if (nodeHasDocLink(child, docUrls)) return true;
    }
  }
  return false;
}

function parseFrontmatter(raw: string): { cover?: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  return { cover: meta.cover, body: match[2] };
}

export function LecturePageView() {
  const { section = "", lecture = "" } = useParams<{ section: string; lecture: string }>();
  const { data, lang, config } = useWiki();
  const { getLecturePage, wikiImages } = data;

  const page = getLecturePage(section, lecture);

  if (!page) return <Navigate to={`/wiki/${section}`} replace />;

  const raw = lang === "en" && page.contentEn ? page.contentEn : page.content;
  const { cover: coverRaw, body: content } = parseFrontmatter(raw);
  const missingEn = lang === "en" && !page.contentEn;

  useEffect(() => {
    if (!page) return;
    const siteTitle = config.siteTitle ?? config.brand?.title;
    const bTitle =
      typeof siteTitle === "string"
        ? siteTitle
        : typeof siteTitle === "object" && siteTitle !== null
        ? (siteTitle as any)[lang] ?? (siteTitle as any)["ru"] ?? (siteTitle as any)["en"] ?? "Wiki"
        : "Wiki";
    const lTitle = lang === "en" && page.titleEn ? page.titleEn : page.title;
    document.title = `${lTitle} | ${bTitle}`;
  }, [page, lang, config.brand, config.siteTitle]);

  const coverSrc = coverRaw?.startsWith("./")
    ? (() => {
        const fileName = coverRaw.replace(/^\.\//, "");
        const key =
          Object.keys(wikiImages).find((p) => p.endsWith(`/${section}/${fileName}`)) ??
          Object.keys(wikiImages).find((p) => p.endsWith(`/${fileName}`));
        return key ? wikiImages[key] : coverRaw;
      })()
    : coverRaw;

  const docUrls = useMemo(() => extractDocUrls(content), [content]);

  const languages = useMemo(() => {
    return config.syntaxLanguages ?? common;
  }, [config.syntaxLanguages]);

  const components = useMemo(
    () => ({
      "community-links": () => <CommunityLinks links={config.socialLinks as any} />,
      "book-card": BookCard,
      BookCard: BookCard,
      bookcard: BookCard,
      div: (props: ComponentProps<"div">) => {
        const className = props.className || "";
        if (
          className === "book-card" ||
          className.includes("book-card") ||
          (props as any)["data-component"] === "book-card"
        ) {
          return <BookCard {...(props as any)} />;
        }
        if (["hint", "warning", "error", "good"].some((c) => className.split(" ").includes(c))) {
          return <div {...props}>{processCalloutChildren(props.children)}</div>;
        }
        return <div {...props} />;
      },
      h1: (p: ComponentProps<"h1">) => <Heading level={1} {...p} />,
      h2: (p: ComponentProps<"h2">) => <Heading level={2} {...p} />,
      h3: (p: ComponentProps<"h3">) => <Heading level={3} {...p} />,
      h4: (p: ComponentProps<"h4">) => <Heading level={4} {...p} />,
      pre: CodeBlockPre,
      code: ({ className, children, ...props }: ComponentProps<"code">) => (
        <code
          className={className}
          style={className ? { padding: 0, background: "transparent" } : undefined}
          {...props}
        >
          {children}
        </code>
      ),
      a: ({ href, children, ...props }: ComponentProps<"a">) => {
        if (href) {
          const yt = parseYouTubeUrl(href);
          if (yt) {
            return (
              <YouTubeEmbed
                embedUrl={yt.embedUrl}
                title={typeof children === "string" ? children : undefined}
              />
            );
          }
          if (docUrls.has(href)) {
            return <DocLinkCard href={href}>{children}</DocLinkCard>;
          }
        }
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      },
      ul: ({ node, children, ...props }: ComponentProps<"ul"> & { node?: Element }) => {
        const isDocList = node ? nodeHasDocLink(node, docUrls) : false;
        return (
          <ul
            style={
              isDocList
                ? {
                    listStyleType: "none",
                    paddingInlineStart: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }
                : undefined
            }
            {...props}
          >
            {children}
          </ul>
        );
      },
      li: ({ node, children, ...props }: ComponentProps<"li"> & { node?: Element }) => {
        const isDocItem = node ? nodeHasDocLink(node, docUrls) : false;
        return (
          <li
            style={isDocItem ? { listStyleType: "none", margin: 0, padding: 0 } : undefined}
            {...props}
          >
            {children}
          </li>
        );
      },
      img: ({ src, alt, ...props }: ComponentProps<"img">) => {
        if (src?.startsWith("./")) {
          const fileName = src.replace(/^\.\//, "");
          const imagePath =
            Object.keys(wikiImages).find((p) => p.endsWith(`/${section}/${fileName}`)) ??
            Object.keys(wikiImages).find((p) => p.endsWith(`/${fileName}`));
          return (
            <ZoomableImage src={imagePath ? wikiImages[imagePath] : src} alt={alt} {...props} />
          );
        }
        return <ZoomableImage src={src} alt={alt} {...props} />;
      },
      ...(config.customComponents ?? {}),
    }),
    [docUrls, section, wikiImages, config.customComponents, config.socialLinks],
  );

  const parentLecture = useMemo(() => {
    if (!section) return undefined;
    const sec = data.wikiPages.find((p) => p.slug === section);
    if (!sec) return undefined;
    for (const l of sec.lectures) {
      if (l.children?.some((c) => c.page?.slug === lecture || c.number === lecture)) {
        if (!l.page) return undefined;
        const pTitle = lang === "en" && l.page.titleEn ? l.page.titleEn : l.page.title;
        return {
          title: pTitle,
          to: `/wiki/${section}/${l.page.slug}`,
        };
      }
    }
    return undefined;
  }, [section, lecture, data.wikiPages, lang]);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Breadcrumbs sectionSlug={section} isLecture parentLecture={parentLecture} />
        <div className="ml-auto">
          <CopyPageButton content={raw} />
        </div>
      </div>
      {coverSrc && (
        <div className="w-full aspect-video max-h-[400px] rounded-xl overflow-hidden border border-border mb-8 bg-muted/20 relative shadow-sm">
          <img src={coverSrc} alt="" className="w-full h-full object-cover object-center block" />
        </div>
      )}
      {missingEn && (
        <div className="mb-6 px-4 py-2.5 rounded border border-border text-sm text-muted-foreground">
          English version is not available yet — showing Russian.
        </div>
      )}
      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeHighlight, { languages }]]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  );
}
export default LecturePageView;
