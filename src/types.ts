import type { ReactNode, ComponentType } from "react";

export interface LecturePage {
  sectionSlug: string;
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string | null;
}

export interface Lecture {
  number: string;
  title: string;
  titleEn: string;
  anchorSlug: string;
  page: LecturePage | null;
}

export interface WikiPage {
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string | null;
  lectures: Lecture[];
}

export interface RawWikiSources {
  /** Map of RU section file paths to content (e.g. from import.meta.glob) */
  sectionsRu?: Record<string, string>;
  /** Map of EN section file paths to content */
  sectionsEn?: Record<string, string>;
  /** Map of RU lecture file paths to content */
  lecturesRu?: Record<string, string>;
  /** Map of EN lecture file paths to content */
  lecturesEn?: Record<string, string>;
  /** Map of image paths to resolved URLs */
  images?: Record<string, string>;
  /**
   * Alternatively, a unified glob of all markdown files.
   * e.g. import.meta.glob("./wiki/**\/*.md", { query: "?raw", import: "default", eager: true })
   */
  rawDocs?: Record<string, string>;
}

export interface WikiData {
  wikiPages: WikiPage[];
  wikiIndex?: WikiPage;
  wikiSections: WikiPage[];
  lecturePages: Map<string, LecturePage>;
  lectureByNum: Map<string, LecturePage>;
  wikiImages: Record<string, string>;
  getLecturePage: (sectionSlug: string, lectureSlug: string) => LecturePage | undefined;
}

export interface WikiBrandConfig {
  /**
   * Title displayed in the sidebar header.
   * Can be a string, a localized object { ru, en }, or a render function.
   */
  title: ReactNode | { ru?: ReactNode; en?: ReactNode; [key: string]: ReactNode };
  /** Subtitle or second line if applicable */
  subtitle?: ReactNode | { ru?: ReactNode; en?: ReactNode; [key: string]: ReactNode };
  /** Custom logo */
  logo?: ReactNode;
  /** Link when clicking header title. Default is "/" */
  homeLink?: string;
}

export interface WikiCategoryConfig {
  id?: string;
  label: string | { ru?: string; en?: string; [key: string]: string | undefined };
  /** Range of numeric section prefixes (e.g. from "01" to "01", from "02" to "12") */
  from?: string;
  to?: string;
  /** Regex pattern to match section slugs */
  pattern?: RegExp;
  /** Custom filter function */
  filter?: (page: WikiPage) => boolean;
}

export interface WikiSocialLink {
  name: string;
  url: string;
  icon?: ReactNode;
  tag?: string;
  desc?: string | { ru?: string; en?: string; [key: string]: string | undefined };
}

export interface WikiAnalyticsConfig {
  googleAnalyticsId?: string;
  linkerDomains?: string[];
}

export interface WikiCookieConsentConfig {
  enabled?: boolean;
  privacyPolicyUrl?: string;
  message?: { ru?: string; en?: string };
  onConsentChange?: (granted: boolean) => void;
}

export interface WikiConfig {
  brand: WikiBrandConfig;
  defaultLanguage?: "ru" | "en" | string;
  supportedLanguages?: ("ru" | "en" | string)[];
  categories?: WikiCategoryConfig[];
  socialLinks?: WikiSocialLink[];
  /** Custom components for markdown rendering (e.g. <community-links />) */
  customComponents?: Record<string, ComponentType<any>>;
  /** Custom syntax highlighting languages for lowlight / highlight.js */
  syntaxLanguages?: Record<string, any>;
  analytics?: WikiAnalyticsConfig;
  cookieConsent?: WikiCookieConsentConfig;
  enableSearch?: boolean;
  enableThemeToggle?: boolean;
}
