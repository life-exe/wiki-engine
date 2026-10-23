import type { WikiCategoryConfig, WikiPage } from "../../types";
import { useWiki } from "../../context/WikiContext";
import { resolveCategoryLabel } from "./navStyles";
import { SectionItem } from "./SectionItem";
import type { NavTreeState } from "./useNavTree";

/** Sidebar navigation tree (top-level categories or plain section list). */
export function NavTree({ tree }: { tree: NavTreeState }) {
  const { config, data, lang } = useWiki();
  const { wikiSections } = data;
  const { openSections, openLectures, toggleSection, toggleLecture, childSlugs, subSectionMap } =
    tree;

  const filterCategoryPages = (cat: WikiCategoryConfig): WikiPage[] => {
    return wikiSections.filter((p) => {
      if (childSlugs.has(p.slug)) return false;
      if (cat.filter) return cat.filter(p);
      if (cat.pattern) return cat.pattern.test(p.slug);
      if (cat.from !== undefined && cat.to !== undefined) {
        const n = p.slug.match(/^(\d+)/)?.[1] ?? "0";
        return n >= cat.from && n <= cat.to;
      }
      return true;
    });
  };

  const renderSection = (page: WikiPage) => (
    <SectionItem
      key={page.slug}
      page={page}
      open={openSections.has(page.slug)}
      onToggle={() => toggleSection(page.slug)}
      subSections={subSectionMap.get(page.slug)}
      openSections={openSections}
      onToggleSection={toggleSection}
      openLectures={openLectures}
      onToggleLecture={toggleLecture}
      subSectionMap={subSectionMap}
    />
  );

  const topLevelCategories = config.categories?.filter((c) => !c.section);

  if (!topLevelCategories || topLevelCategories.length === 0) {
    return (
      <ul className="space-y-0.5">
        {wikiSections.filter((p) => !childSlugs.has(p.slug)).map(renderSection)}
      </ul>
    );
  }

  return (
    <>
      {topLevelCategories.map((cat, idx) => {
        const pages = filterCategoryPages(cat);
        if (pages.length === 0) return null;
        return (
          <div
            key={cat.id ?? idx}
            className="mt-6 first:mt-0 pt-4 first:pt-0 border-t first:border-t-0 border-border/40"
          >
            <div className="px-2.5 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80 select-none">
              {resolveCategoryLabel(cat, lang)}
            </div>
            <ul className="space-y-0.5">{pages.map(renderSection)}</ul>
          </div>
        );
      })}
    </>
  );
}
