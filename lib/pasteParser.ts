export interface ParsedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
}

const TITLE_PATTERNS = [
  /software engineer/i,
  /backend engineer/i,
  /backend developer/i,
  /software development engineer/i,
  /\bsde\b/i,
  /\bswe\b/i,
  /platform engineer/i,
  /infrastructure engineer/i,
  /site reliability/i,
  /\bsre\b/i,
  /data engineer/i,
  /full.?stack engineer/i,
  /systems engineer/i,
];

const LOCATION_PATTERNS = [
  /remote/i,
  /hybrid/i,
  /on.?site/i,
  /\b(new york|san francisco|seattle|austin|boston|chicago|los angeles|denver|atlanta|miami|washington)\b/i,
  /\b[A-Z]{2}\b/, // state abbreviation like CA, NY, WA
  /united states/i,
];

function extractUrl(text: string): string {
  const match = text.match(/https?:\/\/[^\s)>\]"]+/);
  return match ? match[0] : "";
}

function extractTitle(lines: string[]): string {
  // First try: find a line matching known title patterns
  for (const line of lines.slice(0, 10)) {
    if (TITLE_PATTERNS.some((p) => p.test(line))) return line.trim();
  }
  // Fallback: first non-empty line
  return lines.find((l) => l.trim().length > 2)?.trim() ?? "";
}

function extractCompany(lines: string[], titleIndex: number): string {
  // Look for "at Company", "Company ·", "Company |", "@ Company"
  for (const line of lines.slice(0, 15)) {
    const atMatch = line.match(/(?:^|\s)(?:at|@)\s+([A-Z][^\n·|·,]{1,40})/);
    if (atMatch) return atMatch[1].trim();
    const bulletMatch = line.match(/^([A-Z][^·|·\n]{1,40})\s*[·|]/);
    if (bulletMatch) return bulletMatch[1].trim();
  }
  // Fallback: line right after title
  const candidate = lines[titleIndex + 1]?.trim();
  if (candidate && candidate.length < 60 && !LOCATION_PATTERNS.some((p) => p.test(candidate))) {
    return candidate;
  }
  return "";
}

function extractLocation(lines: string[]): string {
  for (const line of lines.slice(0, 20)) {
    if (LOCATION_PATTERNS.some((p) => p.test(line)) && line.trim().length < 80) {
      return line.trim();
    }
  }
  return "";
}

export function parseJobText(text: string): ParsedJob {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const url = extractUrl(text);
  const title = extractTitle(lines);
  const titleIndex = lines.findIndex((l) => l === title);
  const company = extractCompany(lines, titleIndex);
  const location = extractLocation(lines);
  const description = lines.slice(0, 50).join(" "); // first 50 lines as description

  return { title, company, location, url, description };
}
