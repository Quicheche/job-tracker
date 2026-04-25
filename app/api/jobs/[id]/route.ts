import { NextResponse } from "next/server";
import { updateJob } from "@/lib/jobs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const body = await req.json();
  const { status, score, notes } = body;

  const updated = updateJob(id, { status, score, notes });
  if (!updated) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
