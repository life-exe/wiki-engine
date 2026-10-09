#!/usr/bin/env node

/**
 * Link Checker for Wiki Engine Documentation
 *
 * Scans markdown files for broken internal file/image links and dead external URLs.
 * Part of @life-exe/wiki-engine.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ANSI colors
export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Known domains to skip external scraping (private repos, captcha, bot blocking)
export const DEFAULT_IGNORED_DOMAINS = [
  'github.com/EpicGames', // Requires linked Epic Games account (404 for bots)
  'notion.so',            // Cloudflare / Bot protection
  'fab.com',              // Cloudflare / Bot protection
  'localhost',
  '127.0.0.1',
];

// Browser-like headers: a bare fetch UA is refused by many CDNs.
export const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
};

// The server answered, but the answer says nothing about whether the link is dead
export const UNVERIFIABLE_STATUSES = new Set([
  401, 403, 405, 406, 408, 409, 425, 429, 451,
  500, 502, 503, 504, 520, 521, 522, 523, 524,
]);

// Worth a second attempt: throttling and transient server faults
export const RETRYABLE_STATUSES = new Set([
  408, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524,
]);

export function describeStatus(status) {
  if (status === 401 || status === 403) return 'Protected / Bot Check';
  if (status === 405 || status === 406 || status === 409) return 'Robot request refused';
  if (status === 408) return 'Server timeout';
  if (status === 425 || status === 429) return 'Rate limited';
  if (status === 451) return 'Blocked for legal reasons';
  if (status >= 500) return 'Server error';
  return 'Unverified';
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recursively find all .md files in a directory
 */
export function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...findMarkdownFiles(full));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Recursively index all image files in wiki directory
 */
export function findImageFiles(dir) {
  const images = new Set();
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') walk(full);
      } else if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(entry.name)) {
        images.add(entry.name.toLowerCase());
      }
    }
  }
  walk(dir);
  return images;
}

/**
 * Extract links from markdown content, safely ignoring:
 * - Fenced code blocks (``` ... ```)
 * - Inline code spans (` ... `)
 * - HTML code blocks (<code>...</code>)
 * - HTML comments (<!-- ... -->)
 */
export function extractLinks(content, filePath) {
  const links = [];
  const lines = content.split('\n');
  let inFencedBlock = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex];

    if (line.trim().startsWith('```')) {
      inFencedBlock = !inFencedBlock;
      continue;
    }
    if (inFencedBlock) continue;

    // Remove inline code and HTML code tags to prevent false positives
    line = line.replace(/<code>[\s\S]*?<\/code>/g, '');
    line = line.replace(/`[^`]+`/g, '');

    if (line.trim().startsWith('//')) continue;

    // 1. Markdown links and images: [text](url) or ![alt](url)
    const mdLinkRegex = /!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g;
    let match;
    while ((match = mdLinkRegex.exec(line)) !== null) {
      let rawUrl = match[1].trim();
      if (rawUrl.startsWith('<') && rawUrl.endsWith('>')) {
        rawUrl = rawUrl.slice(1, -1);
      }
      if (rawUrl) {
        links.push({
          url: rawUrl,
          file: filePath,
          line: lineIndex + 1,
        });
      }
    }

    // 2. HTML <a href="..."> and <img src="...">
    const htmlRegex = /<(?:a\s+[^>]*href|img\s+[^>]*src)=["']([^"']+)["']/gi;
    let htmlMatch;
    while ((htmlMatch = htmlRegex.exec(line)) !== null) {
      const rawUrl = htmlMatch[1].trim();
      if (rawUrl) {
        links.push({
          url: rawUrl,
          file: filePath,
          line: lineIndex + 1,
        });
      }
    }
  }

  return links;
}

/**
 * Check an internal file / image link
 */
export function checkInternalLink(link, context = {}) {
  const {
    wikiDir = path.resolve(process.cwd(), 'wiki'),
    publicDirs = [],
    locales = [],
    routePrefix = '/wiki/',
    allWikiImages = new Set(),
  } = context;

  const { url, file } = link;
  if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('javascript:')) {
    return { ok: true, link };
  }

  const [rawCleanPath] = url.split(/[?#]/);
  if (!rawCleanPath) {
    return { ok: true, link };
  }

  let decodedCleanPath = rawCleanPath;
  try {
    decodedCleanPath = decodeURIComponent(rawCleanPath);
  } catch {
    // Keep raw if decoding fails
  }

  // 1. Check wiki page route (e.g. /wiki/some-slug)
  if (rawCleanPath.startsWith(routePrefix) || decodedCleanPath.startsWith(routePrefix)) {
    const slug = (rawCleanPath.startsWith(routePrefix) ? rawCleanPath : decodedCleanPath).slice(routePrefix.length);
    const possiblePaths = [
      path.resolve(wikiDir, `${slug}.md`),
      path.resolve(wikiDir, slug),
    ];

    // Check detected or configured locales (e.g., wiki/ru, wiki/en)
    for (const locale of locales) {
      possiblePaths.push(
        path.resolve(wikiDir, locale, `${slug}.md`),
        path.resolve(wikiDir, locale, slug)
      );
    }

    if (possiblePaths.some((p) => fs.existsSync(p))) {
      return { ok: true, link };
    }

    return {
      ok: false,
      link,
      error: `Wiki page route not found on disk: ${rawCleanPath}`,
      resolved: possiblePaths[0],
    };
  }

  // 2. Check absolute path starting with '/'
  if (rawCleanPath.startsWith('/')) {
    const cleanSlices = [rawCleanPath.slice(1), decodedCleanPath.slice(1)];
    let found = false;
    let checkedPath = '';

    for (const pub of publicDirs) {
      for (const rel of cleanSlices) {
        const candidate = path.resolve(pub, rel);
        if (!checkedPath) checkedPath = candidate;
        if (fs.existsSync(candidate)) {
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      for (const rel of cleanSlices) {
        const projectPath = path.resolve(process.cwd(), rel);
        if (fs.existsSync(projectPath)) {
          found = true;
          break;
        }
      }
    }

    // Also check if '/' path is a wiki page (e.g. /guides matching wiki/en/guides.md or wiki/guides.md)
    if (!found) {
      for (const rel of cleanSlices) {
        const possibleWiki = [
          path.resolve(wikiDir, `${rel}.md`),
          path.resolve(wikiDir, rel),
        ];
        for (const locale of locales) {
          possibleWiki.push(
            path.resolve(wikiDir, locale, `${rel}.md`),
            path.resolve(wikiDir, locale, rel)
          );
        }
        if (possibleWiki.some((p) => fs.existsSync(p))) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      return { ok: true, link };
    }

    return {
      ok: false,
      link,
      error: `File not found in public directories, project root or wiki routes: ${rawCleanPath}`,
      resolved: checkedPath || path.resolve(process.cwd(), cleanSlices[0]),
    };
  }

  // 3. Check relative path to current markdown file
  const candidates = [
    path.resolve(path.dirname(file), rawCleanPath),
    path.resolve(path.dirname(file), decodedCleanPath),
    path.resolve(path.dirname(file), `${rawCleanPath}.md`),
    path.resolve(path.dirname(file), `${decodedCleanPath}.md`),
  ];

  const resolved = candidates.find((c) => fs.existsSync(c));
  if (!resolved) {
    // WikiEngine fallback: images in wiki can be shared from ru/ or anywhere in wiki/
    const fileName = path.basename(decodedCleanPath);
    const isImage = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(fileName);
    if (isImage && allWikiImages.has(fileName.toLowerCase())) {
      return { ok: true, link };
    }

    return {
      ok: false,
      link,
      error: `File not found on disk: ${rawCleanPath}`,
      resolved: candidates[0],
    };
  }

  return { ok: true, link };
}

/**
 * Make an HTTP request with timeout
 */
export async function request(url, method, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      redirect: 'follow',
    });
    return { status: res.status };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { networkError: `Timeout (${timeoutMs}ms)`, code: 'TIMEOUT' };
    }
    return { networkError: err.message, code: err?.cause?.code };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One pass over a URL: HEAD first, then GET if HEAD did not clearly succeed
 */
export async function attempt(url, timeoutMs = 15000) {
  const head = await request(url, 'HEAD', timeoutMs);
  if (head.status !== undefined && head.status < 400) return head;

  const get = await request(url, 'GET', timeoutMs);
  if (get.status !== undefined) return get;
  return head.status !== undefined ? head : get;
}

/**
 * Check an external HTTP/HTTPS URL with retries
 */
export async function checkExternalUrl(url, options = {}) {
  const {
    ignoredDomains = DEFAULT_IGNORED_DOMAINS,
    retries = 2,
    timeoutMs = 15000,
    strictMode = false,
  } = options;

  for (const ignored of ignoredDomains) {
    if (url.includes(ignored)) {
      return { ok: true, status: 'SKIPPED', skipped: true };
    }
  }

  let result;
  for (let i = 0; i <= retries; i++) {
    if (i > 0) {
      await sleep(500 * 2 ** (i - 1) + Math.floor(Math.random() * 250));
    }
    result = await attempt(url, timeoutMs);
    const retryable =
      result.status === undefined ? true : RETRYABLE_STATUSES.has(result.status);
    if (!retryable) break;
  }

  if (result.status !== undefined) {
    if (result.status < 400) {
      return { ok: true, status: result.status };
    }
    if (UNVERIFIABLE_STATUSES.has(result.status)) {
      return {
        ok: !strictMode,
        isWarning: true,
        status: result.status,
        error: `HTTP ${result.status} (${describeStatus(result.status)})`,
      };
    }
    return { ok: false, status: result.status, error: `HTTP ${result.status}` };
  }

  if (result.code === 'ENOTFOUND') {
    return { ok: false, status: 'DNS', error: `Domain does not resolve (${result.networkError})` };
  }

  return {
    ok: !strictMode,
    isWarning: true,
    status: 'ERR',
    error: `${result.networkError} - unverified after ${retries + 1} attempt(s)`,
  };
}

/**
 * Programmatic runner for checking wiki links
 */
export async function checkWikiLinks(options = {}) {
  const startTime = Date.now();

  const cwd = options.cwd || process.cwd();
  const wikiDir = path.resolve(cwd, options.wikiDir || 'wiki');
  const routePrefix = options.routePrefix || '/wiki/';
  const internalOnly = Boolean(options.internalOnly);
  const externalOnly = Boolean(options.externalOnly);
  const strictMode = Boolean(options.strict);
  const concurrency = options.concurrency || 10;
  const timeoutMs = options.timeoutMs || 15000;
  const retries = options.retries ?? 2;
  const silent = Boolean(options.silent);

  if (!fs.existsSync(wikiDir)) {
    throw new Error(`Wiki directory not found: ${wikiDir}`);
  }

  // Detect public dirs if not provided
  let publicDirs = options.publicDirs ? options.publicDirs.map((d) => path.resolve(cwd, d)) : [];
  if (publicDirs.length === 0) {
    const candidates = [
      path.resolve(cwd, 'public'),
      path.resolve(cwd, 'apps/web/public'),
      path.resolve(cwd, 'web/public'),
      path.resolve(cwd, 'dist'),
    ];
    publicDirs = candidates.filter((d) => fs.existsSync(d));
  }

  // Detect locales if not provided
  let locales = options.locales ? [...options.locales] : [];
  if (locales.length === 0 && fs.existsSync(wikiDir)) {
    locales = fs
      .readdirSync(wikiDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map((entry) => entry.name);
  }

  const ignoredDomains = [
    ...DEFAULT_IGNORED_DOMAINS,
    ...(options.ignoredDomains || []),
  ];

  const allWikiImages = findImageFiles(wikiDir);
  const mdFiles = findMarkdownFiles(wikiDir);

  const allLinks = [];
  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf8');
    allLinks.push(...extractLinks(content, file));
  }

  const internalLinks = [];
  const externalLinks = [];

  for (const link of allLinks) {
    if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
      externalLinks.push(link);
    } else {
      internalLinks.push(link);
    }
  }

  const log = (...args) => {
    if (!silent) console.log(...args);
  };

  log(`${colors.bold}${colors.cyan}🔍 Scanning markdown links in ${path.relative(cwd, wikiDir) || '.'}...${colors.reset}\n`);
  log(`${colors.dim}Found ${mdFiles.length} files, ${allLinks.length} total links (${internalLinks.length} internal, ${externalLinks.length} external).${colors.reset}\n`);

  let hasFatalErrors = false;
  const brokenInternal = [];

  // 1. Check Internal Links
  if (!externalOnly) {
    log(`${colors.bold}📁 Checking Internal Links & Images...${colors.reset}`);
    const context = {
      wikiDir,
      publicDirs,
      locales,
      routePrefix,
      allWikiImages,
    };

    for (const link of internalLinks) {
      const res = checkInternalLink(link, context);
      if (!res.ok) {
        brokenInternal.push(res);
      }
    }

    if (brokenInternal.length === 0) {
      log(`  ${colors.green}✓ All internal links and images exist! (${internalLinks.length} checked)${colors.reset}\n`);
    } else {
      hasFatalErrors = true;
      log(`  ${colors.red}✗ Found ${brokenInternal.length} broken internal link(s):${colors.reset}`);
      for (const item of brokenInternal) {
        const relFile = path.relative(cwd, item.link.file);
        log(`    ${colors.red}•${colors.reset} ${colors.cyan}${relFile}:${item.link.line}${colors.reset} → ${colors.yellow}${item.link.url}${colors.reset}`);
        log(`      ${colors.dim}${item.error}${colors.reset}`);
      }
      log('');
    }
  }

  // 2. Check External Links
  const brokenExternal = [];
  const warningsExternal = [];

  if (!internalOnly) {
    log(`${colors.bold}🌐 Checking External URLs (concurrency: ${concurrency})...${colors.reset}`);

    const urlLocations = new Map();
    for (const link of externalLinks) {
      if (!urlLocations.has(link.url)) {
        urlLocations.set(link.url, []);
      }
      urlLocations.get(link.url).push(link);
    }

    const uniqueUrls = [...urlLocations.keys()];
    log(`  ${colors.dim}Checking ${uniqueUrls.length} unique external URLs...${colors.reset}`);

    const externalResults = new Map();
    let completedCount = 0;
    let urlIndex = 0;

    async function worker() {
      while (urlIndex < uniqueUrls.length) {
        const url = uniqueUrls[urlIndex++];
        const res = await checkExternalUrl(url, {
          ignoredDomains,
          retries,
          timeoutMs,
          strictMode,
        });
        externalResults.set(url, res);
        completedCount++;
        if (!silent && process.stdout.isTTY && completedCount % 20 === 0) {
          process.stdout.write(`\r  ${colors.dim}Progress: ${completedCount}/${uniqueUrls.length}...${colors.reset}`);
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    if (!silent && process.stdout.isTTY) {
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
    }

    for (const [url, res] of externalResults.entries()) {
      const occurrences = urlLocations.get(url) || [];
      if (!res.ok) {
        brokenExternal.push({ url, res, occurrences });
      } else if (res.isWarning) {
        warningsExternal.push({ url, res, occurrences });
      }
    }

    if (brokenExternal.length === 0 && warningsExternal.length === 0) {
      log(`  ${colors.green}✓ All external URLs are reachable! (${uniqueUrls.length} unique checked)${colors.reset}\n`);
    } else {
      if (brokenExternal.length > 0) {
        hasFatalErrors = true;
        log(`  ${colors.red}✗ Found ${brokenExternal.length} dead external URL(s):${colors.reset}`);
        for (const item of brokenExternal) {
          log(`    ${colors.red}• [${item.res.status}]${colors.reset} ${colors.yellow}${item.url}${colors.reset} (${item.res.error})`);
          for (const loc of item.occurrences) {
            const relFile = path.relative(cwd, loc.file);
            log(`      ${colors.dim}at ${relFile}:${loc.line}${colors.reset}`);
          }
        }
        log('');
      }

      if (warningsExternal.length > 0) {
        log(`  ${colors.yellow}⚠ ${warningsExternal.length} URL(s) could not be verified (bot checks, rate limits, timeouts):${colors.reset}`);
        for (const item of warningsExternal) {
          log(`    ${colors.yellow}• [${item.res.status}]${colors.reset} ${colors.dim}${item.url}${colors.reset} (${item.res.error})`);
        }
        log('');
      }
    }
  }

  const durationSeconds = parseFloat(((Date.now() - startTime) / 1000).toFixed(1));
  log(`${colors.dim}Completed in ${durationSeconds}s.${colors.reset}`);

  return {
    totalFiles: mdFiles.length,
    totalLinks: allLinks.length,
    internalCount: internalLinks.length,
    externalCount: externalLinks.length,
    brokenInternal,
    brokenExternal,
    warningsExternal,
    hasFatalErrors,
    durationSeconds,
  };
}

/**
 * Print CLI Help message
 */
function printHelp() {
  console.log(`
${colors.bold}${colors.cyan}@life-exe/wiki-engine link checker${colors.reset}

${colors.bold}USAGE:${colors.reset}
  wiki-check-links [options]

${colors.bold}OPTIONS:${colors.reset}
  --internal-only          Only check local markdown files and images (fast, offline)
  --external-only          Only check external web URLs
  --strict                 Treat unverifiable URLs (bot checks, rate limits, timeouts) as errors
  --wiki <dir>             Wiki directory (default: wiki)
  --public <dir>           Directory with public static assets (can specify multiple times)
  --locales <locales>      Comma-separated list of locales (e.g. ru,en,eng). Auto-detected if omitted.
  --route-prefix <prefix>  Route prefix for wiki pages (default: /wiki/)
  --ignore-domain <domain> Domain to skip checking (can specify multiple times)
  --concurrency <num>      Max parallel HTTP requests (default: 10)
  --timeout <ms>           HTTP request timeout in milliseconds (default: 15000)
  --retries <num>          Retries for timeouts, 429 and 5xx (default: 2)
  --init-workflow          Create .github/workflows/wiki-links.yml from engine template
  -h, --help               Show this help message
`);
}

/**
 * CLI runner
 */
export async function cli(argv = process.argv.slice(2)) {
  if (argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (argv.includes('--init-workflow') || argv.includes('--init-ci')) {
    const templatePath = path.resolve(fileURLToPath(import.meta.url), '../../templates/wiki-links.yml');
    const targetDir = path.resolve(process.cwd(), '.github/workflows');
    const targetPath = path.join(targetDir, 'wiki-links.yml');
    if (!fs.existsSync(templatePath)) {
      console.error(`${colors.red}Error: Template file not found: ${templatePath}${colors.reset}`);
      process.exit(1);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(templatePath, targetPath);
    console.log(`${colors.green}✓ Created GitHub Actions workflow:${colors.reset} ${path.relative(process.cwd(), targetPath)}`);
    process.exit(0);
  }

  function getArgValue(name, shortName) {
    const idx = argv.indexOf(name) !== -1 ? argv.indexOf(name) : (shortName ? argv.indexOf(shortName) : -1);
    if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('-')) {
      return argv[idx + 1];
    }
    return undefined;
  }

  function getMultiArgs(name) {
    const values = [];
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === name && argv[i + 1] && !argv[i + 1].startsWith('-')) {
        values.push(...argv[i + 1].split(',').map((v) => v.trim()).filter(Boolean));
      }
    }
    return values;
  }

  const wikiDir = getArgValue('--wiki', '-w') || 'wiki';
  const publicDirs = getMultiArgs('--public');
  const locales = getMultiArgs('--locales');
  const routePrefix = getArgValue('--route-prefix') || '/wiki/';
  const ignoredDomains = getMultiArgs('--ignore-domain');
  const concurrency = parseInt(getArgValue('--concurrency', '-c') || '10', 10);
  const timeoutMs = parseInt(getArgValue('--timeout', '-t') || '15000', 10);
  const retries = parseInt(getArgValue('--retries', '-r') || '2', 10);
  const internalOnly = argv.includes('--internal-only');
  const externalOnly = argv.includes('--external-only');
  const strict = argv.includes('--strict');

  try {
    const result = await checkWikiLinks({
      wikiDir,
      publicDirs: publicDirs.length > 0 ? publicDirs : undefined,
      locales: locales.length > 0 ? locales : undefined,
      routePrefix,
      ignoredDomains,
      concurrency,
      timeoutMs,
      retries,
      internalOnly,
      externalOnly,
      strict,
    });

    if (result.hasFatalErrors) {
      process.exit(1);
    } else {
      console.log(`\n${colors.green}${colors.bold}✨ Verification finished successfully!${colors.reset}`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`${colors.red}Error:${colors.reset}`, err.message || err);
    process.exit(1);
  }
}

// Check if file is being executed directly
function isCliExecution() {
  if (!process.argv[1]) return false;
  try {
    const currentScript = fileURLToPath(import.meta.url);
    const invokedScript = path.resolve(process.argv[1]);
    if (currentScript === invokedScript) return true;
    const base = path.basename(invokedScript);
    return base.startsWith('wiki-check-links') || base.startsWith('check-wiki-links') || base === 'check-links.mjs';
  } catch {
    return false;
  }
}

if (isCliExecution()) {
  cli();
}
