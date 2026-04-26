import type { LocationFilter } from "./import";

// ─── Edit these to adjust which job titles are imported ──────────────────────
export const TITLE_KEYWORDS = [
  "software engineer",
  "backend engineer",
  "backend developer",
  "software development engineer",
  "sde",
  "swe",
];

// ─── Edit these to adjust location matching per region ───────────────────────
export const LOCATION_KEYWORDS: Record<LocationFilter, string[]> = {
  us: [
    "united states", "usa", " us,", "(us)", "u.s.",
    "remote", "new york", "san francisco", "seattle",
    "austin", "boston", "chicago", "los angeles", "denver",
    "atlanta", "miami", "washington dc", "washington, d.c",
  ],
  europe: [
    "uk", "united kingdom", "london", "manchester",
    "germany", "berlin", "munich",
    "france", "paris",
    "netherlands", "amsterdam",
    "ireland", "dublin",
    "spain", "madrid", "barcelona",
    "sweden", "stockholm",
    "switzerland", "zurich",
    "europe", "eu",
  ],
  canada: [
    "canada", "toronto", "vancouver", "montreal",
    "ontario", "british columbia", "alberta", "calgary",
  ],
  any: [],
};

// ─── Cities/countries to exclude when filtering US-only ──────────────────────
export const US_EXCLUDE = [
  "canada", "toronto", "vancouver", "montreal",
  "ontario", "british columbia",
];

// ─── Edit these to adjust sponsorship signal detection ───────────────────────
export const SPONSORSHIP_KEYWORDS = [
  "h1b", "h-1b", "visa", "sponsorship", "sponsor",
];

// ─── Edit these to adjust level filtering ────────────────────────────────────
export const LEVEL_KEYWORDS: Record<string, { include: string[]; exclude: string[] }> = {
  entry: {
    include: ["intern", "internship", "new grad", "junior", "entry level", "entry-level"],
    exclude: [],
  },
  mid: {
    include: [],
    exclude: ["senior", "staff", "principal", "lead", "sr.", "intern", "internship", "new grad", "junior"],
  },
  senior: {
    include: ["senior", "staff", "principal", "lead", "sr."],
    exclude: [],
  },
  all: {
    include: [],
    exclude: [],
  },
};

// ─── Discovery inbox: IC SDE/backend role filter ─────────────────────────────
// Title must match at least one include keyword
export const DISCOVERY_TITLE_INCLUDE = [
  "software engineer",
  "backend engineer",
  "backend developer",
  "software development engineer",
  "sde",
  "swe",
  "platform engineer",
  "infrastructure engineer",
  "site reliability engineer",
  "sre",
];

// Title must NOT match any exclude keyword
export const DISCOVERY_TITLE_EXCLUDE = [
  "manager",
  "engineering manager",
  "director",
  "head of",
  "staff engineer",
  "principal",
  "distinguished",
  "architect",
  "intern",
  "internship",
  "new grad",
  "graduate",
  "student",
  "university",
  "junior",
  " jr ",
  "jr.",
  "entry level",
  "entry-level",
];
