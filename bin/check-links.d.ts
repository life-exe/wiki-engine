export interface CheckWikiLinksOptions {
  cwd?: string;
  wikiDir?: string;
  publicDirs?: string[];
  locales?: string[];
  routePrefix?: string;
  ignoredDomains?: string[];
  internalOnly?: boolean;
  externalOnly?: boolean;
  strict?: boolean;
  concurrency?: number;
  timeoutMs?: number;
  retries?: number;
  silent?: boolean;
}

export interface BrokenInternalResult {
  ok: boolean;
  link: {
    url: string;
    file: string;
    line: number;
  };
  error?: string;
  resolved?: string;
}

export interface BrokenExternalResult {
  url: string;
  res: {
    status?: number | string;
    error?: string;
  };
  occurrences: Array<{
    file: string;
    line: number;
    url: string;
  }>;
}

export interface CheckWikiLinksResult {
  totalFiles: number;
  totalLinks: number;
  internalCount: number;
  externalCount: number;
  brokenInternal: BrokenInternalResult[];
  brokenExternal: BrokenExternalResult[];
  warningsExternal: BrokenExternalResult[];
  hasFatalErrors: boolean;
  durationSeconds: number;
}

export function checkWikiLinks(options?: CheckWikiLinksOptions): Promise<CheckWikiLinksResult>;
export function cli(argv?: string[]): Promise<void>;
