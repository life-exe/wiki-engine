import { Link } from "react-router-dom";
import { Folder, ChevronRight } from "lucide-react";
import { useWiki } from "../context/WikiContext";

export interface BreadcrumbItem {
  label: string;
  to: string;
}

export interface BreadcrumbsProps {
  /** The current section slug */
  sectionSlug?: string;
  /** Whether the current view is a lecture page (if true, sectionSlug itself is an ancestor) */
  isLecture?: boolean;
  /** Optional parent lecture for nested lecture pages */
  parentLecture?: { title: string; to: string };
  className?: string;
}

export function Breadcrumbs({
  sectionSlug,
  isLecture = false,
  parentLecture,
  className = "",
}: BreadcrumbsProps) {
  const { data, config, lang } = useWiki();
  const { wikiSections } = data;

  if (!sectionSlug) return null;

  const currentSection = wikiSections.find((p) => p.slug === sectionSlug);
  const sectionTitle = currentSection
    ? lang === "en" && currentSection.titleEn
      ? currentSection.titleEn
      : currentSection.title
    : sectionSlug;

  // 1. Find ancestor sections (where sectionSlug starts with parent.slug + "-")
  const parentSections = wikiSections
    .filter((p) => p.slug !== sectionSlug && sectionSlug.startsWith(p.slug + "-"))
    .sort((a, b) => a.slug.length - b.slug.length);

  const items: BreadcrumbItem[] = [];

  // Top-most parent or current section
  const rootSection = parentSections.length > 0 ? parentSections[0] : currentSection;

  // 2. Check if rootSection matches a category from config.categories
  if (rootSection && config.categories && config.categories.length > 0) {
    const cat = config.categories.find((c) => {
      if (c.filter) return c.filter(rootSection);
      if (c.pattern) return c.pattern.test(rootSection.slug);
      if (c.from !== undefined && c.to !== undefined) {
        const n = rootSection.slug.match(/^(\d+)/)?.[1] ?? "0";
        return n >= c.from && n <= c.to;
      }
      return false;
    });

    if (cat) {
      const catLabel =
        typeof cat.label === "string"
          ? cat.label
          : (cat.label[lang] ?? cat.label["ru"] ?? cat.label["en"] ?? "");

      if (catLabel) {
        const rootTitle =
          lang === "en" && rootSection.titleEn ? rootSection.titleEn : rootSection.title;
        if (catLabel.trim().toLowerCase() !== rootTitle.trim().toLowerCase()) {
          const catPages = wikiSections.filter((p) => {
            if (cat.filter) return cat.filter(p);
            if (cat.pattern) return cat.pattern.test(p.slug);
            if (cat.from !== undefined && cat.to !== undefined) {
              const n = p.slug.match(/^(\d+)/)?.[1] ?? "0";
              return n >= cat.from && n <= cat.to;
            }
            return false;
          });
          const catTo = catPages.length > 0 ? `/wiki/${catPages[0].slug}` : `/wiki/${rootSection.slug}`;
          items.push({ label: catLabel, to: catTo });
        }
      }
    }
  }

  // 3. Add parent sections
  for (const p of parentSections) {
    const pTitle = lang === "en" && p.titleEn ? p.titleEn : p.title;
    if (
      items.length > 0 &&
      items[items.length - 1].label.trim().toLowerCase() === pTitle.trim().toLowerCase()
    ) {
      continue;
    }
    items.push({ label: pTitle, to: `/wiki/${p.slug}` });
  }

  // 4. If this is a lecture page, the section itself is an ancestor
  if (isLecture) {
    items.push({ label: sectionTitle, to: `/wiki/${sectionSlug}` });
    if (parentLecture) {
      items.push({ label: parentLecture.title, to: parentLecture.to });
    }
  }

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 flex-wrap text-sm ${className}`}
    >
      <Folder size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
      {items.map((item, index) => (
        <span key={item.to + index} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight size={13} className="text-muted-foreground/60 shrink-0 select-none" />
          )}
          <Link
            to={item.to}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors truncate max-w-[280px]"
            title={item.label}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
