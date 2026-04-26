import { NextResponse } from "next/server";
import { insertIfNew } from "@/lib/jobs";
import type { PreviewJob } from "@/lib/import";

export async function POST(req: Request) {
  const { jobs }: { jobs: PreviewJob[] } = await req.json();
  if (!Array.isArray(jobs)) {
    return NextResponse.json({ error: "jobs must be an array" }, { status: 400 });
  }

  let imported_count = 0;
  let skipped_count = 0;
  let invalid_count = 0;

  for (const job of jobs) {
    if (!job.url || !job.url.trim()) {
      invalid_count++;
      continue;
    }
    const result = insertIfNew({
      company: job.company,
      title: job.title,
      location: job.location,
      url: job.url,
      description: job.description,
      status: "saved",
      score: null,
      notes: "",
    });
    if (result === "inserted") imported_count++;
    else skipped_count++;
  }

  return NextResponse.json({ imported_count, skipped_count, invalid_count });
}
