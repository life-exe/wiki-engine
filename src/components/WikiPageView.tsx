import { useParams, Navigate, Link } from "react-router-dom";
import { isValidElement, type ReactNode, useMemo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/vs2015.css";
import { common } from "lowlight";
import { useWiki } from "../context/WikiContext";
import { CodeBlockPre } from "./CodeBlock";
import { ZoomableImage } from "./ZoomableImage";
import { CommunityLinks } from "./CommunityLinks";
import { DocLinkCard, extractDocUrls } from "./DocLinkCard";
import { YouTubeEmbed, parseYouTubeUrl } from "./YouTubeEmbed";
import { BookCard } from "./BookCard";
import { CopyPageButton } from "./CopyPageButton";
import { Breadcrumbs } from "./Breadcrumbs";
import { processCalloutChildren } from "./Callout";
import { ChevronRight } from "lucide-react";

interface Props {
  isIndex?: boolean;
}

function nodeToText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node))
    return nodeToText((node.props as { children?: ReactNode }).children ?? "");
  return "";
}

function parseFrontmatter(raw: string): { cover?: string; cards?: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) meta[key.trim()] = rest.join(":").trim();
  }
  return { cover: meta.cover, cards: meta.cards, body: match[2] };
}

export function WikiPageView({ isIndex }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const { data, lang, config } = useWiki();
  const { wikiPages, wikiIndex, wikiImages } = data;

  const page = isIndex ? wikiIndex : wikiPages.find((p) => p.slug === slug);

  if (!page) return <Navigate to="/" replace />;

  const raw = lang === "en" && page.contentEn ? page.contentEn : page.content;
  const { cover: coverRaw, cards: cardsMeta, body: content } = parseFrontmatter(raw);
  const missingEn = lang === "en" && !page.contentEn;
  const lectures = page.lectures;

  useEffect(() => {
    if (!page) return;
    const siteTitle = config.siteTitle ?? config.brand?.title;
    const bTitle =
      typeof siteTitle === "string"
        ? siteTitle
        : typeof siteTitle === "object" && siteTitle !== null
        ? (siteTitle as any)[lang] ?? (siteTitle as any)["ru"] ?? (siteTitle as any)["en"] ?? "Wiki"
        : "Wiki";
    const finalBTitle = typeof bTitle === "string" ? bTitle : "Wiki";
    const pTitle = lang === "en" && page.titleEn ? page.titleEn : page.title;
    document.title = isIndex ? finalBTitle : `${pTitle} | ${finalBTitle}`;
  }, [page, lang, isIndex, config.brand, config.siteTitle]);

  const subSections = useMemo(() => {
    return wikiPages.filter(
      (other) => other.slug !== page.slug && other.slug.startsWith(page.slug + "-"),
    );
  }, [wikiPages, page.slug]);

  const childCards = useMemo(() => {
    const items: Array<{ title: string; path: string; orderKey: string }> = [];

    for (const lecture of lectures) {
      const lTitle = lang === "en" && lecture.titleEn ? lecture.titleEn : lecture.title;
      const path = lecture.page
        ? `/wiki/${page.slug}/${lecture.page.slug}`
        : `/wiki/${page.slug}#${lecture.anchorSlug}`;
      items.push({
        title: lTitle,
        path,
        orderKey: lecture.page?.slug ?? lecture.anchorSlug ?? lecture.number,
      });
    }

    for (const sub of subSections) {
      const sTitle = lang === "en" && sub.titleEn ? sub.titleEn : sub.title;
      items.push({
        title: sTitle,
        path: `/wiki/${sub.slug}`,
        orderKey: sub.slug,
      });
    }

    items.sort((a, b) => {
      const relA = a.orderKey.startsWith(page.slug + "-")
        ? a.orderKey.slice(page.slug.length + 1)
        : a.orderKey;
      const relB = b.orderKey.startsWith(page.slug + "-")
        ? b.orderKey.slice(page.slug.length + 1)
        : b.orderKey;
      return relA.localeCompare(relB, undefined, { numeric: true });
    });
    return items;
  }, [lectures, subSections, lang, page.slug]);

  const hasDetailedContent = /(^|\n)##\s+/.test(content);
  const showChildCards =
    !isIndex &&
    childCards.length > 0 &&
    (cardsMeta === "true" || (cardsMeta !== "false" && !hasDetailedContent));

  const coverSrc = coverRaw?.startsWith("./")
    ? (() => {
        const fileName = coverRaw.replace(/^\.\//, "");
        const key =
          Object.keys(wikiImages).find((p) => p.endsWith(`/${page.slug}/${fileName}`)) ??
          Object.keys(wikiImages).find((p) => p.endsWith(`/${fileName}`));
        return key ? wikiImages[key] : coverRaw;
      })()
    : coverRaw;

  const docUrls = useMemo(() => extractDocUrls(content), [content]);

  const languages = useMemo(() => {
    return config.syntaxLanguages ?? common;
  }, [config.syntaxLanguages]);

  const components = useMemo(() => {
    return {
      "community-links": () => <CommunityLinks links={config.socialLinks as any} />,
      "book-card": BookCard,
      BookCard: BookCard,
      bookcard: BookCard,
      div: (props: React.ComponentProps<"div">) => {
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
      pre: CodeBlockPre,
      code: ({ className, children, ...props }: React.ComponentProps<"code">) => (
        <code
          className={className}
          style={className ? { padding: 0, background: "transparent" } : undefined}
          {...props}
        >
          {children}
        </code>
      ),
      a: ({ href, children, ...props }: React.ComponentProps<"a">) => {
        if (href?.match(/^\.\/[\w-]+\.md$/)) {
          const mdSlug = href.replace(/^\.\//, "").replace(/\.md$/, "");
          return (
            <Link to={`/wiki/${mdSlug}`} {...(props as object)}>
              {children}
            </Link>
          );
        }
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
      td: ({ children, ...props }: React.ComponentProps<"td">) => {
        const text = nodeToText(children as ReactNode).trim();
        const lecture = lectures.find((l) => {
          const expected = lang === "en" && l.titleEn ? l.titleEn : l.title;
          return expected === text && l.page;
        });
        if (lecture?.page) {
          return (
            <td {...props}>
              <Link to={`/wiki/${page.slug}/${lecture.page.slug}`}>{children}</Link>
            </td>
          );
        }
        return <td {...props}>{children}</td>;
      },
      img: ({ src, alt, ...props }: React.ComponentProps<"img">) => {
        if (src?.startsWith("./")) {
          const fileName = src.replace(/^\.\//, "");
          const imagePath =
            Object.keys(wikiImages).find((p) => p.endsWith(`/${page.slug}/${fileName}`)) ??
            Object.keys(wikiImages).find((p) => p.endsWith(`/${fileName}`));
          return (
            <ZoomableImage
              src={imagePath ? wikiImages[imagePath] : src}
              alt={alt}
              {...props}
            />
          );
        }
        return <ZoomableImage src={src} alt={alt} {...props} />;
      },
      ...(config.customComponents ?? {}),
    };
  }, [page.slug, lectures, lang, wikiImages, config.customComponents, config.socialLinks, docUrls]);

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        {!isIndex && <Breadcrumbs sectionSlug={page.slug} isLecture={false} />}
        <div className="ml-auto">
          <CopyPageButton content={raw} />
        </div>
      </div>
      {missingEn && (
        <div className="mb-6 px-4 py-2.5 rounded border border-border text-sm text-muted-foreground">
          English version is not available yet — showing Russian.
        </div>
      )}
      {coverSrc && (
        <div className="w-full aspect-video max-h-[400px] rounded-xl overflow-hidden border border-border mb-8 bg-muted/20 relative shadow-sm">
          <img src={coverSrc} alt="" className="w-full h-full object-cover object-center block" />
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

        {showChildCards && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 not-prose mt-8">
            {childCards.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center justify-between px-5 py-3.5 rounded-xl border border-border bg-accent/30 hover:bg-accent hover:border-border text-foreground transition-all duration-150 no-underline shadow-xs hover:shadow-sm"
              >
                <span className="font-medium text-sm sm:text-base text-foreground group-hover:text-foreground transition-colors leading-snug line-clamp-2">
                  {item.title}
                </span>
                <ChevronRight
                  size={18}
                  className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-3"
                />
              </Link>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
export default WikiPageView;
