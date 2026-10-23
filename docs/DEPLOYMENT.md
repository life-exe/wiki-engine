# Deployment

`@life-exe/wiki-engine` is an npm package; there is no hosted service in this repository.
The public site [wiki.life-exe.com](https://wiki.life-exe.com/) is a separate consumer project.

## npm publish

Workflow: `.github/workflows/publish.yml`, triggered on every push to `master` (and manually).

1. Reads `version` from `package.json`.
2. If that version already exists on npm, the run stops (no-op).
3. Otherwise: `pnpm verify` → `npm publish --provenance --access public` → git tag `v<version>`
   and a GitHub Release with generated notes.

Authentication uses **npm Trusted Publishing (OIDC)** — no `NPM_TOKEN` secret.
The trusted publisher is configured on npmjs.com for package `@life-exe/wiki-engine`
(repository `life-exe/wiki-engine`, workflow `publish.yml`). Renaming the workflow file
requires updating that setting.

To release: bump `version` in `package.json`, commit, push to `master`.

## CI

`.github/workflows/ci.yml` runs on pushes and pull requests: `pnpm verify` and a gitleaks
scan of the full history.

## Environment variables

None. The package reads no environment variables; the workflows use only the built-in
`GITHUB_TOKEN` and OIDC.
