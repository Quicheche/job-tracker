import { NextResponse } from "next/server";
import { fetchPreview } from "@/lib/import";
import type { LocationFilter, LevelFilter, PreviewJob } from "@/lib/import";
import db from "@/lib/db";
import { DISCOVERY_TITLE_INCLUDE, DISCOVERY_TITLE_EXCLUDE } from "@/lib/importRules";

export type FreshWindow = "new" | "24h" | "7d";

const WINDOW_MS: Record<FreshWindow, number> = {
  new: Infinity,
  "24h": 24 * 60 * 60 * 1000,
  "7d":  7  * 24 * 60 * 60 * 1000,
};

function isDiscoveryTitle(title: string): boolean {
  const t = title.toLowerCase();
  if (DISCOVERY_TITLE_EXCLUDE.some((k) => t.includes(k))) return false;
  return DISCOVERY_TITLE_INCLUDE.some((k) => t.includes(k));
}

// seenUrls: { [url]: { seenAt: number } } — sent from client localStorage
function isFresh(
  job: PreviewJob & { postedAt?: string | null },
  window: FreshWindow,
  seenUrls: Record<string, { seenAt: number }>
): boolean {
  if (window === "new") return true; // already excluded by seen check
  const ms = WINDOW_MS[window];
  const now = Date.now();

  // Try source timestamp first
  if (job.postedAt) {
    const d = new Date(job.postedAt);
    if (!isNaN(d.getTime())) return now - d.getTime() < ms;
  }

  // Fall back to first_seen_at from localStorage
  const seen = seenUrls[job.url];
  if (seen?.seenAt) return now - seen.seenAt < ms;

  // No timestamp available — include by default
  return true;
}

export async function POST(req: Request) {
  const {
    slugs,
    locationFilter = "us",
    levelFilter = "all",
    freshWindow = "new",
    seenUrls = {},
  } = await req.json();

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json({ error: "slugs array is required" }, { status: 400 });
  }

  const locFilter = (["us", "europe", "canada", "any"].includes(locationFilter)
    ? locationFilter : "us") as LocationFilter;
  const lvlFilter = (["all", "entry", "mid", "senior"].includes(levelFilter)
    ? levelFilter : "all") as LevelFilter;
  const window = (["new", "24h", "7d"].includes(freshWindow)
    ? freshWindow : "new") as FreshWindow;

  // DB dedup
  const dbUrls = new Set(
    (db.prepare("SELECT url FROM jobs WHERE url != ''").all() as { url: string }[])
      .map((r) => r.url)
  );

  const allJobs: PreviewJob[] = [];
  const errors: string[] = [];

  for (const slug of slugs) {
    const url = `https://boards.greenhouse.io/${slug}`;
    try {
      const jobs = await fetchPreview(url, { locationFilter: locFilter, levelFilter: lvlFilter });
      for (const job of jobs) {
        if (!isDiscoveryTitle(job.title)) continue;
        if (dbUrls.has(job.url)) continue;
        if (seenUrls[job.url] && window === "new") continue;
        if (!isFresh(job as PreviewJob & { postedAt?: string | null }, window, seenUrls)) continue;
        allJobs.push(job);
      }
    } catch (err) {
      errors.push(`${slug}: ${err instanceof Error ? err.message : "failed"}`);
    }
  }

  return NextResponse.json({ jobs: allJobs, errors });
}
