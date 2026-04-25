export type JobStatus = "saved" | "applied" | "interviewing" | "rejected";

export interface Job {
  id: number;
  company: string;
  title: string;
  location: string;
  url: string;
  description: string;
  status: JobStatus;
  score: number | null;
  notes: string;
  created_at: string;
}
