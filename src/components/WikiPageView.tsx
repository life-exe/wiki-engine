import { useParams, Navigate, Link } from "react-router-dom";
import { isValidElement, type ReactNode, useMemo } from "react";
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

export function WikiPageView({ isIndex }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const { data, lang, config } = useWiki();
  const { wikiPages, wikiIndex, wikiImages } = data;

  const page = isIndex ? wikiIndex : wikiPages.find((p) => p.slug === slug);

  if (!page) return <Navigate to="/" replace />;

  const raw = lang === "en" && page.contentEn ? page.contentEn : page.content;
  const { cover: coverRaw, body: content } = parseFrontmatter(raw);
  const missingEn = lang === "en" && !page.contentEn;
  const lectures = page.lectures;

  const coverSrc = coverRaw?.startsWith("./")
    ? (() => {
        const fileName = coverRaw.replace("./", "");
        const key = Object.keys(wikiImages).find((p) => p.endsWith(fileName));
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
          const fileName = src.replace("./", "");
          const imagePath = Object.keys(wikiImages).find(
            (p) => p.endsWith(`${page.slug}/${fileName}`) || p.endsWith(`wiki/${fileName}`),
          );
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
      </article>
    </div>
  );
}
export default WikiPageView;
