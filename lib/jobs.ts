import db from "./db";
import type { Job } from "./types";

export function getAllJobs(): Job[] {
  return db.prepare("SELECT * FROM jobs ORDER BY created_at DESC").all() as Job[];
}

export function createJob(data: Omit<Job, "id" | "created_at">): Job {
  const stmt = db.prepare(`
    INSERT INTO jobs (company, title, location, url, description, status, score, notes)
    VALUES (@company, @title, @location, @url, @description, @status, @score, @notes)
  `);
  const result = stmt.run(data);
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(result.lastInsertRowid) as Job;
}

export function updateJob(id: number, data: Partial<Pick<Job, "status" | "score" | "notes">>): Job | null {
  const fields = Object.keys(data)
    .map((k) => `${k} = @${k}`)
    .join(", ");
  if (!fields) return null;
  db.prepare(`UPDATE jobs SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Job | null;
}
