import { evaluateJob } from "./evaluator";
import {
  TITLE_KEYWORDS,
  LOCATION_KEYWORDS,
  US_EXCLUDE,
  SPONSORSHIP_KEYWORDS,
  LEVEL_KEYWORDS,
} from "./importRules";
import type { PreviewJob, LocationFilter, LevelFilter } from "./import";

export interface ImportFilters {
  locationFilter: LocationFilter;
  levelFilter: LevelFilter;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function isRelevantTitle(title: string): boolean {
  const t = title.toLowerCase();
  return TITLE_KEYWORDS.some((k) => t.includes(k));
}

function isMatchingLocation(location: string, filter: LocationFilter): boolean {
  if (filter === "any") return true;
  if (!location) return true;
  const l = location.toLowerCase();
  if (filter === "us" && US_EXCLUDE.some((k) => l.includes(k))) return false;
  return LOCATION_KEYWORDS[filter].some((k) => l.includes(k));
}

function isMatchingLevel(title: string, filter: LevelFilter): boolean {
  if (filter === "all") return true;
  const t = title.toLowerCase();
  const rules = LEVEL_KEYWORDS[filter];
  if (rules.exclude.some((k) => t.includes(k))) return false;
  if (rules.include.length === 0) return true;
  return rules.include.some((k) => t.includes(k));
}

function hasSponsorship(text: string): boolean {
  const t = text.toLowerCase();
  return SPONSORSHIP_KEYWORDS.some((k) => t.includes(k));
}

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

function isRecent(timestamp: string | number | null | undefined): boolean {
  if (!timestamp) return true; // no timestamp — include by default
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() < SIXTY_DAYS_MS;
}

function buildPreviewJob(
  title: string,
  company: string,
  location: string,
  url: string,
  description: string
): PreviewJob {
  const { recommendation, reason } = evaluateJob(title, description);
  return {
    title,
    company,
    location,
    url,
    description,
    sponsorship: hasSponsorship(description),
    recommendation,
    reason,
  };
}

function applyFilters(
  title: string,
  location: string,
  filters: ImportFilters
): boolean {
  return (
    isRelevantTitle(title) &&
    isMatchingLevel(title, filters.levelFilter) &&
    isMatchingLocation(location, filters.locationFilter)
  );
}

// ─── Adapter interface ───────────────────────────────────────────────────────

export interface SourceAdapter {
  name: string;
  detect(url: string): boolean;
  fetch(url: string, filters: ImportFilters): Promise<PreviewJob[]>;
}

// ─── Greenhouse adapter ──────────────────────────────────────────────────────

const greenhouseAdapter: SourceAdapter = {
  name: "Greenhouse",
  detect(url) {
    try {
      return new URL(url).hostname === "boards.greenhouse.io";
    } catch { return false; }
  },
  async fetch(url, filters) {
    const slug = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (!slug) throw new Error("Could not extract company slug from Greenhouse URL");

    const res = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error(`Greenhouse API error: ${res.status}`);
    const data = await res.json();

    const results: PreviewJob[] = [];
    for (const job of data.jobs ?? []) {
      const location = job.location?.name ?? "";
      if (!applyFilters(job.title, location, filters)) continue;
      const jobUrl = job.absolute_url ?? "";
      if (!jobUrl) continue;
      const description = stripHtml(job.content ?? "");
      results.push(buildPreviewJob(job.title, slug, location, jobUrl, description));
      if (results.length >= 50) break;
    }
    return results;
  },
};

// ─── Lever adapter ───────────────────────────────────────────────────────────

const leverAdapter: SourceAdapter = {
  name: "Lever",
  detect(url) {
    try {
      return new URL(url).hostname === "jobs.lever.co";
    } catch { return false; }
  },
  async fetch(url, filters) {
    const slug = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (!slug) throw new Error("Could not extract company slug from Lever URL");

    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) throw new Error(`Lever API error: ${res.status}`);
    const data = await res.json();

    const results: PreviewJob[] = [];
    for (const job of Array.isArray(data) ? data : []) {
      const location = job.categories?.location ?? job.workplaceType ?? "";
      if (!applyFilters(job.text, location, filters)) continue;
      if (job.categories?.commitment?.toLowerCase().includes("part")) continue;
      if (!isRecent(job.createdAt)) continue;
      const jobUrl = job.hostedUrl ?? "";
      if (!jobUrl) continue;
      const description = stripHtml(
        (job.descriptionPlain ?? job.description ?? "").toString()
      );
      results.push(buildPreviewJob(job.text, slug, location, jobUrl, description));
      if (results.length >= 50) break;
    }
    return results;
  },
};

// ─── Oracle Careers adapter ──────────────────────────────────────────────────

const oracleAdapter: SourceAdapter = {
  name: "Oracle Careers",
  detect(url) {
    try {
      return new URL(url).hostname === "careers.oracle.com";
    } catch { return false; }
  },
  async fetch(url, filters) {
    // Oracle's careers page uses an internal REST API — pass query params through
    const parsed = new URL(url);
    const apiUrl = new URL("https://careers.oracle.com/en/sites/jobsearch/requisitions");
    // Forward relevant facet params
    for (const [k, v] of parsed.searchParams.entries()) {
      apiUrl.searchParams.set(k, v);
    }
    apiUrl.searchParams.set("limit", "50");
    apiUrl.searchParams.set("offset", "0");

    const res = await fetch(apiUrl.toString(), {
      headers: { "Accept": "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Oracle Careers API error: ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        "This Oracle careers page is not supported yet because it does not expose JSON."
      );
    }
    const data = await res.json();

    const jobs = data.requisitionList ?? data.jobs ?? [];
    if (!Array.isArray(jobs)) throw new Error("Unexpected Oracle response format");

    const results: PreviewJob[] = [];
    for (const job of jobs) {
      const title = job.title ?? job.requisitionTitle ?? "";
      const location = job.primaryLocation ?? job.location ?? "";
      if (!applyFilters(title, location, filters)) continue;
      if (!isRecent(job.postedDate ?? job.lastUpdatedDate)) continue;
      const jobUrl = job.applyUrl ?? job.jobUrl ??
        `https://careers.oracle.com/en/sites/jobsearch/job/${job.requisitionNumber ?? ""}`;
      if (!jobUrl) continue;
      const description = stripHtml(job.jobDescription ?? job.description ?? "");
      results.push(buildPreviewJob(title, "Oracle", location, jobUrl, description));
      if (results.length >= 50) break;
    }
    return results;
  },
};

// ─── Registry — add new adapters here ────────────────────────────────────────

export const registry: SourceAdapter[] = [
  greenhouseAdapter,
  leverAdapter,
  oracleAdapter,
];
