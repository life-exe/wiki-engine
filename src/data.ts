import type { RawWikiSources, WikiData, WikiPage, Lecture, LecturePage } from "./types";

export function parseTitle(content: string): string {
  const clean = content.replace(/^\uFEFF/, "");
  const match = clean.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

export function stripFrontmatter(content: string): string {
  const clean = content.replace(/^\uFEFF/, "");
  const m = clean.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return m ? m[1] : clean;
}

export function parseFrontmatter(content: string): Record<string, string> {
  const clean = content.replace(/^\uFEFF/, "");
  const m = clean.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const res: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon !== -1) {
      const k = line.slice(0, colon).trim();
      const v = line.slice(colon + 1).trim().replace(/^['"](.*)['"]$/, "$1");
      res[k] = v;
    }
  }
  return res;
}

export function hasProseLines(content: string): boolean {
  const body = stripFrontmatter(content);
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || t.startsWith("|")) continue;
    return true;
  }
  return false;
}

export function isSidebarStub(ruContent: string, enContent: string): boolean {
  return hasProseLines(ruContent) && !hasProseLines(enContent);
}

export function fileSlug(filePath: string): string {
  return filePath.split("/").pop()!.replace(/\.md$/, "");
}

export function parseLectures(
  sectionSlug: string,
  content: string,
  contentEn: string | null,
  lectureByNum: Map<string, LecturePage>,
): Lecture[] {
  const lectures: Lecture[] = [];
  const enLines = contentEn ? contentEn.split("\n") : [];

  // Build EN title map by row index for pairing
  const enTitles: string[] = [];
  let enInTable = false;
  let enHeaderPassed = false;
  for (const line of enLines) {
    const t = line.trim();
    if (!t.startsWith("|")) {
      if (enInTable) {
        enInTable = false;
        enHeaderPassed = false;
      }
      continue;
    }
    const cells = t.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    if (cells[cells.length - 1] === "") cells.pop();

    if (cells.length < 3) continue;
    if (cells[0] === "#") {
      enInTable = true;
      enHeaderPassed = false;
      continue;
    }
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      enHeaderPassed = true;
      continue;
    }
    if (!enInTable || !enHeaderPassed) continue;
    enTitles.push(
      cells[2]
        ?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\*\*/g, "")
        .replace(/`/g, "")
        .trim() ?? "",
    );
  }

  let enIdx = 0;
  const lines = content.split("\n");
  let inTable = false;
  let headerPassed = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (inTable) {
        inTable = false;
        headerPassed = false;
      }
      continue;
    }
    const cells = trimmed.split("|").map((c) => c.trim());
    if (cells[0] === "") cells.shift();
    if (cells[cells.length - 1] === "") cells.pop();

    if (cells.length < 3) continue;
    if (cells[0] === "#") {
      inTable = true;
      headerPassed = false;
      continue;
    }
    if (cells.every((c) => /^[-:]+$/.test(c))) {
      headerPassed = true;
      continue;
    }
    if (!inTable || !headerPassed) continue;

    const num = cells[0];
    const titleCell = cells[2];
    if (!titleCell || titleCell === "—" || titleCell === "-" || titleCell.startsWith("**"))
      continue;
    const rawTitle = titleCell.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    const title = rawTitle.replace(/\*\*/g, "").replace(/`/g, "").trim();
    if (!title) continue;

    const titleEn = enTitles[enIdx] ?? "";
    enIdx++;

    const page = lectureByNum.get(`${sectionSlug}/${num}`) ?? null;
    const anchorSlug = `${num}-${title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "-")
      .slice(0, 40)}`;

    lectures.push({ number: num, title, titleEn, anchorSlug, page });
  }

  return lectures;
}

export function createWikiData(sources: RawWikiSources): WikiData {
  let sectionRuRaw = sources.sectionsRu ?? {};
  let sectionEnRaw = sources.sectionsEn ?? {};
  let lectureRuRaw = sources.lecturesRu ?? {};
  let lectureEnRaw = sources.lecturesEn ?? {};
  const wikiImages = sources.images ?? {};

  // If a unified rawDocs object was provided, decompose it by path pattern
  if (sources.rawDocs && Object.keys(sectionRuRaw).length === 0) {
    sectionRuRaw = {};
    sectionEnRaw = {};
    lectureRuRaw = {};
    lectureEnRaw = {};

    for (const [path, content] of Object.entries(sources.rawDocs)) {
      const normalized = path.replace(/\\/g, "/");
      const parts = normalized.split("/");
      const fileName = parts.at(-1) ?? "";

      const isRu = normalized.includes("/ru/");
      const isEn = normalized.includes("/en/");

      // Check depth: /ru/section.md vs /ru/section/lecture.md
      const subParts = normalized.split(isRu ? "/ru/" : isEn ? "/en/" : "/wiki/");
      const relative = subParts[1] ?? fileName;
      const depth = relative.split("/").length;

      if (depth === 1) {
        if (isEn) sectionEnRaw[normalized] = content;
        else sectionRuRaw[normalized] = content;
      } else {
        if (isEn) lectureEnRaw[normalized] = content;
        else lectureRuRaw[normalized] = content;
      }
    }
  }

  // EN section lookup: slug → content
  const sectionEnBySlug = new Map<string, string>();
  for (const [p, c] of Object.entries(sectionEnRaw)) {
    sectionEnBySlug.set(fileSlug(p), c);
  }

  // EN lecture lookup: sectionSlug/lectureSlug → content
  const lectureEnByKey = new Map<string, string>();
  for (const [p, c] of Object.entries(lectureEnRaw)) {
    const parts = p.replace(/\\/g, "/").split("/");
    const dir = parts.at(-2)!;
    const slug = fileSlug(p);
    lectureEnByKey.set(`${dir}/${slug}`, c);
  }

  // Lecture pages (RU + EN)
  const lecturePages = new Map<string, LecturePage>();
  const lectureByNum = new Map<string, LecturePage>();

  for (const [filePath, content] of Object.entries(lectureRuRaw)) {
    const parts = filePath.replace(/\\/g, "/").split("/");
    const dirName = parts.at(-2)!;
    const sectionSlug = dirName;
    const slug = fileSlug(filePath);
    const enContent = lectureEnByKey.get(`${sectionSlug}/${slug}`) ?? null;
    const fm = parseFrontmatter(content);
    const parent = fm.parent || undefined;
    const numMatch = slug.match(/^(\d+)/);
    const order =
      fm.order !== undefined && !isNaN(Number(fm.order))
        ? Number(fm.order)
        : numMatch
          ? parseInt(numMatch[1], 10)
          : undefined;
    const page: LecturePage = {
      sectionSlug,
      slug,
      title: parseTitle(content) || slug,
      titleEn: enContent ? parseTitle(enContent) || slug : "",
      content,
      contentEn: enContent,
      parent,
      order,
    };
    lecturePages.set(`${sectionSlug}/${slug}`, page);
    if (numMatch) {
      const numKey = `${sectionSlug}/${numMatch[1]}`;
      if (!lectureByNum.has(numKey)) lectureByNum.set(numKey, page);
    }
    if (order !== undefined) {
      const orderKey = `${sectionSlug}/${order}`;
      if (!lectureByNum.has(orderKey)) lectureByNum.set(orderKey, page);
    }
  }

  const wikiPages: WikiPage[] = Object.entries(sectionRuRaw)
    .map(([filePath, content]) => {
      const slug = fileSlug(filePath);
      const rawEn = sectionEnBySlug.get(slug) ?? null;
      const stub = rawEn ? isSidebarStub(content, rawEn) : false;
      const contentEn = rawEn && !stub ? rawEn : null;
      const fm = parseFrontmatter(content);
      const parent = fm.parent || undefined;
      const numMatch = slug.match(/^(\d+)/);
      const order =
        fm.order !== undefined && !isNaN(Number(fm.order))
          ? Number(fm.order)
          : numMatch
            ? parseInt(numMatch[1], 10)
            : undefined;
      let lectures = parseLectures(slug, content, rawEn, lectureByNum);
      if (lectures.length === 0) {
        const matching: LecturePage[] = [];
        for (const lp of lecturePages.values()) {
          if (lp.sectionSlug === slug) {
            matching.push(lp);
          }
        }
        if (matching.length > 0) {
          matching.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return a.slug.localeCompare(b.slug, undefined, { numeric: true });
          });
          lectures = matching.map((lp) => {
            const m = lp.slug.match(/^(\d+)/);
            const num = lp.order !== undefined ? String(lp.order) : (m ? m[1] : "");
            return {
              number: num,
              title: lp.title,
              titleEn: lp.titleEn,
              anchorSlug: lp.slug,
              page: lp,
              order: lp.order,
            };
          });
        }
      }

      // Build lecture tree if any lectures have parent
      const topLectures: Lecture[] = [];
      const lectureByLookup = new Map<string, Lecture>();
      for (const lec of lectures) {
        if (lec.page?.slug) {
          lectureByLookup.set(lec.page.slug.toLowerCase(), lec);
          const withoutNum = lec.page.slug.replace(/^\d+-/, "").toLowerCase();
          if (withoutNum) lectureByLookup.set(withoutNum, lec);
        }
        if (lec.number) lectureByLookup.set(lec.number.toLowerCase(), lec);
        if (lec.anchorSlug) lectureByLookup.set(lec.anchorSlug.toLowerCase(), lec);
      }

      for (const lec of lectures) {
        const parentKey = lec.page?.parent?.trim().toLowerCase();
        if (parentKey) {
          let parentLec =
            lectureByLookup.get(parentKey) ??
            lectureByLookup.get(parentKey.replace(/^\d+-/, ""));
          if (!parentLec) {
            for (const other of lectures) {
              if (other === lec) continue;
              const oSlug = other.page?.slug.toLowerCase() ?? "";
              const oTitle = other.title.toLowerCase();
              if (
                oSlug.includes(parentKey) ||
                oTitle.includes(parentKey) ||
                (parentKey === "vs" &&
                  (oSlug.includes("ide") ||
                    oTitle.includes("ide") ||
                    oTitle.includes("visual studio")))
              ) {
                parentLec = other;
                break;
              }
            }
          }
          if (parentLec && parentLec !== lec) {
            parentLec.children = parentLec.children ?? [];
            parentLec.children.push(lec);
            continue;
          }
        }
        topLectures.push(lec);
      }
      lectures = topLectures;
      return {
        slug,
        title: parseTitle(content) || slug,
        titleEn: rawEn ? parseTitle(rawEn) || slug : "",
        content,
        contentEn,
        lectures,
        parent,
        order,
      };
    })
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.slug.localeCompare(b.slug, undefined, { numeric: true });
    });

  const wikiIndex =
    wikiPages.find((p) => p.slug === "00-welcome" || p.slug === "welcome") ??
    wikiPages.find((p) => p.slug === "README");
  const wikiSections = wikiPages.filter((p) => p.slug !== "README");

  const getLecturePage = (sectionSlug: string, lectureSlug: string): LecturePage | undefined => {
    const direct =
      lecturePages.get(`${sectionSlug}/${lectureSlug}`) ??
      lectureByNum.get(`${sectionSlug}/${lectureSlug}`);
    if (direct) return direct;
    const numMatch = lectureSlug.match(/^(\d+)/);
    if (numMatch) {
      return lectureByNum.get(`${sectionSlug}/${numMatch[1]}`);
    }
    return undefined;
  };

  return {
    wikiPages,
    wikiIndex,
    wikiSections,
    lecturePages,
    lectureByNum,
    wikiImages,
    getLecturePage,
  };
}
