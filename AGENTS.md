# AGENTS.md — @life-exe/wiki-engine

React component library (published to npm) that renders a multilingual Markdown wiki:
layout with sidebar, page views, search, Mermaid, code highlighting, link checker CLI.
Consumers (e.g. wiki.life-exe.com) install it and pass their Markdown via `createWikiData`.

## Commands

- `pnpm install` — pnpm version is pinned in `package.json#packageManager`, Node in `.nvmrc`.
- `pnpm verify` — **run before every commit**: format:check → lint → typecheck → dupes → knip → test → build.
- `pnpm format` — prettier write (printWidth 100).
- `pnpm lint` — ESLint (`eslint.config.js`: typescript-eslint + react-hooks incl. React Compiler rules).
- `pnpm typecheck` — `tsc --noEmit`.
- `pnpm dupes` — jscpd copy-paste check (`.jscpd.json`, fails above 3%).
- `pnpm knip` — unused files/exports/deps (`knip.json`; tailwind packages are ignored because they are only referenced from `src/style.css`).
- `pnpm test` — vitest (`src/**/*.test.ts`).
- `pnpm build` — Vite library build to `dist/` + declarations via `tsconfig.build.json`.
- `pnpm check:links` — link checker CLI (`bin/check-links.mjs`).

A husky pre-commit hook runs lint-staged and, if installed, `gitleaks git --staged`.

## Layout

- `src/index.ts` — public API; everything exported here is semver-relevant.
- `src/types.ts` — public config/data types (`WikiConfig`, `WikiPage`, `Lecture`, …).
- `src/data.ts` — builds `WikiData` from raw Markdown sources.
- `src/components/` — UI. `WikiLayout.tsx` (header, sidebar tree, footer) is the largest file.
- `src/context/`, `src/hooks/` — `WikiContext`, language and theme.
- `src/utils/url.ts` — routing helpers (`basePath`, link resolution); covered by tests.
- `src/languages/ue-cpp.ts` — separate entry `@life-exe/wiki-engine/languages/ue-cpp`.
- `bin/check-links.mjs` — standalone Node CLI, also exported as `./check-links`.
- `templates/` — files shipped for consumers (e.g. a links-check workflow); not used by this repo's CI.

## Rules

- This is a library: React, react-dom and react-router-dom are peer deps — never bundle them.
- Keep public types backward compatible. Changing a type in `src/types.ts` or an export in
  `src/index.ts` can break consumers; prefer additive changes.
- No `any`. For "any component" use `JSXElementConstructor<never>`; for callbacks that must accept
  narrower annotated params, use method syntax (`filter?(item: A | B): boolean`).
- Hooks must not follow an early return; split into a wrapper + content component instead.
- Don't call `setState` synchronously in effects; adjust state during render on prop change.
- No environment variables or secrets in this package (see `.env.example`).
- Don't weaken lint rules or delete tests to get `verify` green — fix the cause.
- Size limits (eslint.config.js, `[warn, error]`): file 400/600 lines, function 150/300 lines,
  complexity 15/30, depth 4/5, params 5/7. Legacy exceptions to the error level are listed in
  `eslint.config.js` (`bin/check-links.mjs`, `src/data.ts`, `layout/LectureItem.tsx`,
  `layout/SectionItem.tsx`); shrink that list, don't grow it.

## Releases

Every push to `master` publishes to npm if `package.json#version` is not yet on npm
(see `docs/DEPLOYMENT.md`). Bump the version deliberately; commit messages follow
Conventional Commits and user-facing changes mention the version, e.g. `fix: … (v0.1.66)`.
