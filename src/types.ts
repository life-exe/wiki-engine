import type { ReactNode, ComponentType } from "react";

export interface LecturePage {
  sectionSlug: string;
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string | null;
  parent?: string;
  order?: number;
  /** Icon name from the `icon:` frontmatter key, resolved via `WikiConfig.icons`. */
  icon?: string;
}

export interface Lecture {
  number: string;
  title: string;
  titleEn: string;
  anchorSlug: string;
  page: LecturePage | null;
  children?: Lecture[];
  order?: number;
  /** Icon name from the `icon:` frontmatter key, resolved via `WikiConfig.icons`. */
  icon?: string;
}

export interface WikiPage {
  slug: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string | null;
  lectures: Lecture[];
  parent?: string;
  order?: number;
  /** Icon name from the `icon:` frontmatter key, resolved via `WikiConfig.icons`. */
  icon?: string;
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
   * Title displayed in the brand header.
   * Can be a string, a localized object { ru, en }, or a render function.
   */
  title: ReactNode | { ru?: ReactNode; en?: ReactNode; [key: string]: ReactNode };
  /** Subtitle or second line if applicable */
  subtitle?: ReactNode | { ru?: ReactNode; en?: ReactNode; [key: string]: ReactNode };
  /** Custom logo */
  logo?: ReactNode;
  /** Link when clicking header title. Default is "/" */
  homeLink?: string;
  /** Whether to show the accent dot (e.g. LifeEXE orange square). Defaults to false unless specified */
  showAccentDot?: boolean;
  /** Optional custom CSS classes for the brand title link in the header */
  className?: string;
}

export interface WikiHeaderLink {
  label: string | { ru?: string; en?: string; [key: string]: string | undefined };
  url: string;
  external?: boolean;
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

export interface WikiPoweredByConfig {
  enabled?: boolean;
  prefix?: string | { ru?: string; en?: string; [key: string]: string | undefined };
  text?: string | { ru?: string; en?: string; [key: string]: string | undefined };
  url?: string;
  icon?: ReactNode;
  tagline?: string | { ru?: string; en?: string; [key: string]: string | undefined };
  copyright?: string | { ru?: string; en?: string; [key: string]: string | undefined };
  copyrightUrl?: string;
}

export interface WikiConfig {
  brand: WikiBrandConfig;
  /**
   * Title used for HTML document title (<title> tag and browser tab).
   * If not specified, falls back to brand.title or "Wiki".
   */
  siteTitle?: string | { ru?: string; en?: string; [key: string]: string | undefined };
  headerLinks?: WikiHeaderLink[];
  defaultLanguage?: "ru" | "en" | string;
  supportedLanguages?: ("ru" | "en" | string)[];
  categories?: WikiCategoryConfig[];
  socialLinks?: WikiSocialLink[];
  /**
   * Icons available to the `icon:` frontmatter key, keyed by name.
   * Lookup is case-insensitive and dash/underscore agnostic; an `icon:` value that is
   * not registered here is rendered as-is, which covers emoji (`icon: 🤍`).
   */
  icons?: Record<string, ReactNode>;
  /** Custom components for markdown rendering (e.g. <community-links />) */
  customComponents?: Record<string, ComponentType<any>>;
  /** Custom syntax highlighting languages for lowlight / highlight.js */
  syntaxLanguages?: Record<string, any>;
  analytics?: WikiAnalyticsConfig;
  cookieConsent?: WikiCookieConsentConfig;
  enableSearch?: boolean;
  enableThemeToggle?: boolean;
  enableHeader?: boolean;
  poweredBy?: boolean | WikiPoweredByConfig;
}
