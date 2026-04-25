import { NextResponse } from "next/server";
import { getAllJobs, createJob } from "@/lib/jobs";

export async function GET() {
  const jobs = getAllJobs();
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { company, title, location = "", url = "", description = "", status = "saved", score = null, notes = "" } = body;

  if (!company || !title) {
    return NextResponse.json({ error: "company and title are required" }, { status: 400 });
  }

  const job = createJob({ company, title, location, url, description, status, score, notes });
  return NextResponse.json(job, { status: 201 });
}
