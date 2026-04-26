import { registry } from "./sourceAdapters";
import type { ImportFilters } from "./sourceAdapters";

export interface PreviewJob {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  sponsorship: boolean;
  recommendation: string;
  reason: string;
}

export type LocationFilter = "us" | "europe" | "canada" | "any";
export type LevelFilter = "all" | "entry" | "mid" | "senior";

export async function fetchPreview(
  url: string,
  filters: ImportFilters
): Promise<PreviewJob[]> {
  const adapter = registry.find((a) => a.detect(url));
  if (!adapter) {
    throw new Error(
      "Unsupported source. Paste a Greenhouse, Lever, or Oracle Careers URL."
    );
  }
  return adapter.fetch(url, filters);
}
