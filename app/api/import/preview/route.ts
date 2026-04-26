import { NextResponse } from "next/server";
import { fetchPreview } from "@/lib/import";
import type { LocationFilter, LevelFilter } from "@/lib/import";

export async function POST(req: Request) {
  const { url, locationFilter = "us", levelFilter = "all" } = await req.json();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const locFilter = (["us", "europe", "canada", "any"].includes(locationFilter)
    ? locationFilter : "us") as LocationFilter;

  const lvlFilter = (["all", "entry", "mid", "senior"].includes(levelFilter)
    ? levelFilter : "all") as LevelFilter;

  try {
    const jobs = await fetchPreview(url, {
      locationFilter: locFilter,
      levelFilter: lvlFilter,
    });
    return NextResponse.json({ jobs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch jobs";
    const status = message.startsWith("Unsupported") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
