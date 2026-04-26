import { NextResponse } from "next/server";
import { parseJobText } from "@/lib/pasteParser";
import { evaluateJob } from "@/lib/evaluator";

export async function POST(req: Request) {
  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const parsed = parseJobText(text);
  const { recommendation, reason } = evaluateJob(parsed.title, parsed.description);

  return NextResponse.json({ ...parsed, recommendation, reason });
}
