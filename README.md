# @life-exe/wiki-engine

Modern, high-performance documentation and wiki engine built with React, Vite, and Tailwind CSS.

Features:
- 📖 **Markdown & GFM Support**: Headings, tables, blockquotes, task lists, and custom callouts (`hint`, `warning`, `error`, `good`).
- 🌐 **Multilingual (RU / EN / Custom)**: Switch languages with persistent state and automatic fallback banners when a translation is missing.
- 🎨 **Dark / Light Theme**: Built-in theme switcher with system preference detection and localStorage persistence.
- 🔍 **Full-text Search (Ctrl+K)**: Instant snippet search across all sections and lectures with keyboard navigation.
- ↔️ **Resizable Sidebar**: Draggable width resizer with collapse/expand all and smooth collapse animation.
- 💻 **Syntax Highlighting & Copy**: Highlight.js integration with language badge, one-click code copying, and customizable language definitions (including Unreal Engine C++).
- 📊 **Mermaid Diagrams**: Interactive rendering of flowcharts, sequence diagrams, state machines, etc.
- 🔍 **Zoomable Images**: Click to zoom lightbox for screenshots and diagrams.
- 🔗 **Doc Link Cards**: Automatic rich preview cards for documentation links with caching.
- 🍪 **Cookie Consent & Analytics**: Built-in Google Analytics 4 integration with Google Consent Mode v2 and customizable privacy banner.

---

## Installation

```bash
# Using pnpm
pnpm add @life-exe/wiki-engine

# Using npm
npm install @life-exe/wiki-engine
```

### Peer Dependencies
Ensure you have the following installed in your project:
```json
{
  "dependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "react-router-dom": ">=6.0.0"
  }
}
```

---

## Quick Start (New Project)

### 1. Structure your documentation folder

```
my-project/
├── docs/
│   ├── ru/
│   │   ├── README.md              # Home page (RU)
│   │   ├── 01-intro.md            # Section (RU)
│   │   └── 01-intro/
│   │       └── 01-getting-started.md  # Sub-page/lecture (RU)
│   └── en/
│       ├── README.md              # Home page (EN)
│       ├── 01-intro.md            # Section (EN)
│       └── 01-intro/
│           └── 01-getting-started.md  # Sub-page/lecture (EN)
├── src/
│   ├── App.tsx
│   ├── wiki.config.tsx
│   ├── wikiData.ts
│   └── main.tsx
```

### 2. Prepare data loader (`src/wikiData.ts`)

```ts
import { createWikiData } from "@life-exe/wiki-engine";

export const wikiData = createWikiData({
  sectionsRu: import.meta.glob("../docs/ru/*.md", { query: "?raw", import: "default", eager: true }),
  sectionsEn: import.meta.glob("../docs/en/*.md", { query: "?raw", import: "default", eager: true }),
  lecturesRu: import.meta.glob("../docs/ru/*/*.md", { query: "?raw", import: "default", eager: true }),
  lecturesEn: import.meta.glob("../docs/en/*/*.md", { query: "?raw", import: "default", eager: true }),
  images: import.meta.glob("../docs/**/*.{png,jpg,jpeg,gif,svg}", { import: "default", eager: true }),
});
```

### 3. Create configuration (`src/wiki.config.tsx`)

```tsx
import { defineWikiConfig } from "@life-exe/wiki-engine";

export const wikiConfig = defineWikiConfig({
  brand: {
    title: {
      ru: "Моя База Знаний",
      en: "My Knowledge Base",
    },
    homeLink: "/",
  },
  defaultLanguage: "ru",
  supportedLanguages: ["ru", "en"],
  categories: [
    { id: "intro", label: { ru: "Введение", en: "Intro" }, from: "01", to: "01" },
    { id: "guides", label: { ru: "Руководства", en: "Guides" }, from: "02", to: "99" },
  ],
  cookieConsent: {
    enabled: true,
    privacyPolicyUrl: "/privacy",
  },
});
```

### 4. Render the App (`src/App.tsx`)

```tsx
import { WikiApp } from "@life-exe/wiki-engine";
import "@life-exe/wiki-engine/style.css";
import { wikiConfig } from "./wiki.config";
import { wikiData } from "./wikiData";

export default function App() {
  return <WikiApp config={wikiConfig} data={wikiData} />;
}
```

---

## Configuration API (`WikiConfig`)

| Option | Type | Description |
|---|---|---|
| `brand.title` | `string \| { ru?: string, en?: string } \| ReactNode` | Sidebar header title |
| `brand.logo` | `ReactNode` | Optional logo icon or image |
| `brand.homeLink` | `string` | Link on title click (default: `"/"`) |
| `defaultLanguage` | `string` | Initial language code (default: `"ru"`) |
| `supportedLanguages`| `string[]` | Array of languages (e.g. `["ru", "en"]` or `["en"]`). If length <= 1, language toggle is hidden |
| `categories` | `WikiCategoryConfig[]` | Groupings for sidebar navigation |
| `syntaxLanguages` | `Record<string, any>` | Custom highlight.js languages for lowlight / code blocks |
| `customComponents` | `Record<string, ComponentType>` | Custom React components usable in markdown (e.g. `<community-links />`) |
| `analytics` | `{ googleAnalyticsId?: string, linkerDomains?: string[] }` | Google Analytics 4 tracking |
| `cookieConsent` | `{ enabled?: boolean, privacyPolicyUrl?: string }` | Cookie consent popup |
| `enableSearch` | `boolean` | Enable or disable Ctrl+K search (default: `true`) |
| `enableThemeToggle` | `boolean` | Enable or disable Dark/Light theme button (default: `true`) |

---

## Category Matching

Categories can group sections in the sidebar in multiple ways:

```ts
categories: [
  // 1. By numeric prefix range (e.g. 01-about.md to 05-basics.md)
  { label: "Basics", from: "01", to: "05" },

  // 2. By regex pattern
  { label: "Advanced", pattern: /^adv-/ },

  // 3. By custom filter function
  { label: "Special", filter: (page) => page.slug.includes("special") }
]
```

---

## Page Frontmatter

Markdown pages support an optional YAML frontmatter block:

```md
---
order: 2
parent: courses
icon: courses
---

# My Page
```

| Key | Description |
| --- | --- |
| `order` | Sort position in the sidebar (falls back to a numeric filename prefix). |
| `parent` | Slug of the page this one nests under. |
| `icon` | Icon rendered next to the page title in the sidebar. |

The engine ships no icon set of its own — which glyph a name means is up to your wiki.
Register the icons you want under `icons` in the config and reference them by name from
frontmatter:

```tsx
import { Users, BookOpen } from "lucide-react";

export const wikiConfig = defineWikiConfig({
  // ...
  icons: {
    community: <Users size={17} />,
    books: <BookOpen size={17} />,
  },
});
```

```md
---
icon: community
---
```

Lookup is case-insensitive and dash/underscore agnostic (`book-open`, `BookOpen` and
`book_open` all hit the same entry). An `icon:` value that is not registered is rendered
as-is, so emoji work without any config at all:

```md
---
icon: 🤍
---
```

---

## Unreal Engine C++ Support

To use Unreal Engine C++ keyword and type highlighting:

```ts
import { ueLangs } from "@life-exe/wiki-engine/languages/ue-cpp";

export const wikiConfig = defineWikiConfig({
  // ...
  syntaxLanguages: ueLangs,
});
```

---

## License

MIT
