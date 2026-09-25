import React, { type ComponentProps } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWiki } from "../context/WikiContext";
import { isExternalUrl, isAssetUrl, resolveWikiLink } from "../utils/url";
import { parseYouTubeUrl, YouTubeEmbed } from "./YouTubeEmbed";
import { YouTubePlaylistCard } from "./YouTubePlaylistCard";
import { DocLinkCard } from "./DocLinkCard";

export interface MarkdownLinkProps extends ComponentProps<"a"> {
  currentSectionSlug?: string;
  docUrls?: Set<string>;
}

export function MarkdownLink({
  href,
  children,
  currentSectionSlug,
  docUrls,
  ...props
}: MarkdownLinkProps) {
  const { data, getWikiUrl } = useWiki();
  const location = useLocation();

  if (!href) {
    return <a {...props}>{children}</a>;
  }

  // 1. YouTube video or playlist
  const yt = parseYouTubeUrl(href);
  if (yt) {
    if (yt.type === "playlist") {
      return (
        <YouTubePlaylistCard
          url={href}
          playlistId={yt.playlistId || yt.id}
          title={typeof children === "string" ? children : undefined}
        >
          {children}
        </YouTubePlaylistCard>
      );
    }
    return (
      <YouTubeEmbed
        embedUrl={yt.embedUrl}
        title={typeof children === "string" ? children : undefined}
      />
    );
  }

  // 2. Doc link card (for lists of documentation links)
  if (docUrls?.has(href)) {
    return <DocLinkCard href={href}>{children}</DocLinkCard>;
  }

  // 3. Anchor link on current page (e.g. "#heading")
  if (href.startsWith("#")) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  // 4. External link (http, https, mailto, tel, file, etc.) or static asset (.zip, .pdf, images, etc.)
  if (isExternalUrl(href) || isAssetUrl(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  // 5. Derive section slug if not explicitly passed
  let effectiveSectionSlug = currentSectionSlug;
  if (!effectiveSectionSlug) {
    const cleanPath = location.pathname.replace(/^\/+/, "");
    const parts = cleanPath.split("/").filter(Boolean);
    if (parts.length > 0) {
      effectiveSectionSlug = parts[0];
    }
  }

  // 6. Internal wiki route -> React Router Link
  const { subpath, hash } = resolveWikiLink({
    href,
    currentSectionSlug: effectiveSectionSlug,
    wikiPages: data.wikiPages,
  });

  const targetUrl = getWikiUrl(subpath) + hash;

  return (
    <Link to={targetUrl} {...(props as object)}>
      {children}
    </Link>
  );
}
