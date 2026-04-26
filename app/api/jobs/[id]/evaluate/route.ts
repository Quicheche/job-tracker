import { NextResponse } from "next/server";
import db from "@/lib/db";
import { evaluateJob } from "@/lib/evaluator";
import type { Job } from "@/lib/types";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Job | null;
  if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });

  const result = evaluateJob(job.title, job.description ?? "");
  return NextResponse.json(result);
}
