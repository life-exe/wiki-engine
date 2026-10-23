import { describe, expect, it } from "vitest";
import { getWikiPath, isAssetUrl, isExternalUrl, normalizeBasePath, resolveWikiLink } from "./url";

describe("normalizeBasePath", () => {
  it.each([
    [undefined, ""],
    ["", ""],
    ["/", ""],
    ["wiki", "/wiki"],
    ["/wiki/", "/wiki"],
    ["docs/wiki", "/docs/wiki"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeBasePath(input)).toBe(expected);
  });
});

describe("getWikiPath", () => {
  it("builds paths without a base", () => {
    expect(getWikiPath("", "community")).toBe("/community");
    expect(getWikiPath("", "/community")).toBe("/community");
    expect(getWikiPath("", "courses#anchor")).toBe("/courses#anchor");
    expect(getWikiPath("", "")).toBe("/");
  });

  it("prefixes the base path", () => {
    expect(getWikiPath("/wiki", "courses/ue-pro")).toBe("/wiki/courses/ue-pro");
    expect(getWikiPath("/wiki", "")).toBe("/wiki");
  });
});

describe("isExternalUrl / isAssetUrl", () => {
  it("detects external links", () => {
    expect(isExternalUrl("https://example.com")).toBe(true);
    expect(isExternalUrl("//cdn.example.com/a.js")).toBe(true);
    expect(isExternalUrl("mailto:a@b.c")).toBe(true);
    expect(isExternalUrl("./intro.md")).toBe(false);
    expect(isExternalUrl(undefined)).toBe(false);
  });

  it("detects asset links, ignoring hash and query", () => {
    expect(isAssetUrl("files/project.zip")).toBe(true);
    expect(isAssetUrl("img/a.PNG?v=2#x")).toBe(true);
    expect(isAssetUrl("intro.md")).toBe(false);
  });
});

describe("resolveWikiLink", () => {
  const wikiPages = [
    { slug: "01-intro", lectures: [{ page: { slug: "01-about-course" } }] },
    { slug: "03-cpp-engineering", lectures: [{ anchorSlug: "02-cmake-empty-project" }] },
  ];

  it("strips relative prefixes and the .md extension", () => {
    expect(resolveWikiLink({ href: "../01-intro/README.md#top", wikiPages })).toEqual({
      subpath: "01-intro",
      hash: "#top",
    });
  });

  it("fuzzy-matches section slugs without the numeric prefix", () => {
    expect(resolveWikiLink({ href: "cpp-engineering/02-cmake-empty-project", wikiPages })).toEqual({
      subpath: "03-cpp-engineering/02-cmake-empty-project",
      hash: "",
    });
  });

  it("resolves a bare lecture slug to its section", () => {
    expect(resolveWikiLink({ href: "01-about-course.md?x=1", wikiPages })).toEqual({
      subpath: "01-intro/01-about-course",
      hash: "?x=1",
    });
  });
});
