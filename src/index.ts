import "./style.css";

// Core Components
export { WikiApp, WikiRoutes } from "./components/WikiApp";
export type { WikiAppProps } from "./components/WikiApp";
export { WikiLayout } from "./components/WikiLayout";
export { WikiPageView } from "./components/WikiPageView";
export { LecturePageView } from "./components/LecturePageView";
export { SearchPopup } from "./components/SearchPopup";
export { CodeBlockPre } from "./components/CodeBlock";
export { MermaidDiagram } from "./components/MermaidDiagram";
export { ZoomableImage } from "./components/ZoomableImage";
export { DocLinkCard, extractDocUrls } from "./components/DocLinkCard";
export { YouTubeEmbed, parseYouTubeUrl } from "./components/YouTubeEmbed";
export type { YouTubeEmbedProps, YouTubeParsed } from "./components/YouTubeEmbed";
export { YouTubePlaylistCard } from "./components/YouTubePlaylistCard";
export type { YouTubePlaylistCardProps } from "./components/YouTubePlaylistCard";
export { BookCard } from "./components/BookCard";
export type { BookCardProps, BookLink } from "./components/BookCard";
export { CopyPageButton } from "./components/CopyPageButton";
export type { CopyPageButtonProps } from "./components/CopyPageButton";
export { Breadcrumbs } from "./components/Breadcrumbs";
export type { BreadcrumbsProps, BreadcrumbItem } from "./components/Breadcrumbs";
export {
  CommunityLinks,
  defaultCommunityLinks,
  YoutubeIcon,
  GithubIcon,
  TelegramIcon,
  ItchIcon,
  XIcon,
  PatreonIcon,
  BoostyIcon,
  MediumIcon,
  UdemyIcon,
} from "./components/CommunityLinks";
export type { CommunityLinkItem } from "./components/CommunityLinks";
export { CookieConsent } from "./components/CookieConsent";

// Context & Hooks
export { WikiProvider, WikiContext, useWiki } from "./context/WikiContext";
export type { WikiContextValue } from "./context/WikiContext";
export { LangContext, useLang } from "./context/LangContext";
export { useLanguage } from "./hooks/useLanguage";
export { useTheme } from "./hooks/useTheme";
export type { Theme } from "./hooks/useTheme";

// Analytics
export { initGA, updateConsentState, trackPageView, AnalyticsTracker } from "./analytics";

// Data Model & Parsers
export {
  createWikiData,
  parseTitle,
  stripFrontmatter,
  hasProseLines,
  isSidebarStub,
  fileSlug,
  parseLectures,
} from "./data";

// Configuration Helper
import type { WikiConfig } from "./types";
export function defineWikiConfig(config: WikiConfig): WikiConfig {
  return config;
}

// Types
export type {
  LecturePage,
  Lecture,
  WikiPage,
  RawWikiSources,
  WikiData,
  WikiBrandConfig,
  WikiCategoryConfig,
  WikiSocialLink,
  WikiAnalyticsConfig,
  WikiCookieConsentConfig,
  WikiConfig,
} from "./types";
