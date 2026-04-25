"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Job, JobStatus } from "@/lib/types";

const STATUSES: JobStatus[] = ["saved", "applied", "interviewing", "rejected"];
const FILTERS = ["all", ...STATUSES] as const;
type Filter = typeof FILTERS[number];

function JobRow({ job }: { job: Job }) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [score, setScore] = useState<string>(job.score?.toString() ?? "");
  const [notes, setNotes] = useState(job.notes ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSave() {
    setSaveState("saving");
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, score: score ? Number(score) : null, notes }),
    });
    router.refresh();
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1500);
  }

  return (
    <tr>
      <td>
        {job.url ? (
          <a href={job.url} target="_blank" rel="noreferrer">{job.company}</a>
        ) : (
          job.company
        )}
      </td>
      <td>{job.title}</td>
      <td>{job.location || "—"}</td>
      <td>
        <select
          className={`row-select status-${status}`}
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td>
        <input
          className="row-input row-input-score"
          type="number"
          min={1}
          max={10}
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
      </td>
      <td>
        <input
          className="row-input row-input-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </td>
      <td>{job.created_at.slice(0, 10)}</td>
      <td>
        <button className={`save-btn${saveState === "saved" ? " save-btn-saved" : ""}`} onClick={handleSave} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export default function JobTable({ jobs }: { jobs: Job[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = jobs
    .filter((j) => filter === "all" || j.status === filter)
    .filter((j) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return j.company.toLowerCase().includes(q) || j.title.toLowerCase().includes(q);
    });

  return (
    <div>
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search company or title..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="empty-msg">
          {filter !== "all" ? `No jobs with status "${filter}".` : "No jobs yet. Add one below."}
        </p>
      ) : (
        <table className="job-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Title</th>
              <th>Location</th>
              <th>Status</th>
              <th>Score</th>
              <th>Notes</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((job) => <JobRow key={job.id} job={job} />)}
          </tbody>
        </table>
      )}
    </div>
  );
}
