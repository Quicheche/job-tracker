"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PreviewJob, LocationFilter, LevelFilter } from "@/lib/import";

const BADGE: Record<string, { label: string; color: string }> = {
  proceed: { label: "✅ proceed", color: "#166534" },
  maybe:   { label: "🟡 maybe",   color: "#92400e" },
  skip:    { label: "❌ skip",    color: "#991b1b" },
};

export default function ImportForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("us");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewJob[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ imported_count: number; skipped_count: number; invalid_count: number } | null>(null);

  async function handleFetch() {
    setLoading(true);
    setError("");
    setPreview([]);
    setSelected(new Set());
    setResult(null);

    const res = await fetch("/api/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, locationFilter, levelFilter }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error); return; }
    if (data.jobs.length === 0) { setError("No matching jobs found."); return; }
    setPreview(data.jobs);
    setSelected(new Set(
      data.jobs
        .map((_: PreviewJob, i: number) => i)
        .filter((i: number) => data.jobs[i].recommendation === "proceed")
    ));
  }

  function toggleAll() {
    if (selected.size === preview.length) setSelected(new Set());
    else setSelected(new Set(preview.map((_, i) => i)));
  }

  function toggle(i: number) {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  }

  async function handleImport() {
    const jobs = Array.from(selected).map((i) => preview[i]);
    setLoading(true);
    const res = await fetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs }),
    });
    const data = await res.json();
    setLoading(false);
    setResult(data);
    setPreview([]);
    setSelected(new Set());
    setUrl("");
    router.refresh();
  }

  return (
    <div className="form-card" style={{ maxWidth: 680, width: "100%", boxSizing: "border-box" }}>
      <h2>Import Jobs</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
        Paste a Greenhouse or Lever board URL to find relevant backend/SDE roles.
      </p>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Location:</label>
          <select
            className="row-select"
            style={{ width: "auto" }}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as LocationFilter)}
          >
            <option value="us">US only</option>
            <option value="europe">Europe only</option>
            <option value="canada">Canada only</option>
            <option value="any">Any location</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Level:</label>
          <select
            className="row-select"
            style={{ width: "auto" }}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
          >
            <option value="all">All levels</option>
            <option value="entry">Entry level</option>
            <option value="mid">Mid level</option>
            <option value="senior">Senior+</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          style={{ flex: 1, minWidth: 0, marginBottom: 0 }}
          placeholder="https://boards.greenhouse.io/company or https://jobs.lever.co/company"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="submit-btn"
          style={{ width: "auto", flexShrink: 0, padding: "8px 16px" }}
          onClick={handleFetch}
          disabled={loading || !url.trim()}
        >
          {loading && preview.length === 0 ? "Fetching…" : "Fetch"}
        </button>
      </div>

      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}

      {preview.length > 0 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#555" }}>{preview.length} jobs found</span>
            <button className="filter-btn" onClick={toggleAll}>
              {selected.size === preview.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 6, overflow: "hidden", marginBottom: 12, width: "100%" }}>
            {preview.map((job, i) => (
              <label
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: i < preview.length - 1 ? "1px solid #f0f0f0" : "none",
                  cursor: "pointer",
                  background: selected.has(i) ? "#fafafa" : "#fff",
                  boxSizing: "border-box",
                  width: "100%",
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  style={{ marginTop: 3 }}
                />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                    {job.title}
                    {job.sponsorship && (
                      <span title="Sponsorship signals found" style={{ marginLeft: 6 }}>💼</span>
                    )}
                    <span style={{ marginLeft: 8, fontSize: 12, color: BADGE[job.recommendation].color }}>
                      {BADGE[job.recommendation].label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                    {job.company} · {job.location || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3, fontStyle: "italic" }}>
                    {job.reason}
                  </div>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 11,
                      color: "#0070f3",
                      display: "block",
                      overflowWrap: "break-word",
                      wordBreak: "break-all",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {job.url}
                  </a>
                </div>
              </label>
            ))}
          </div>

          <button
            className="submit-btn"
            onClick={handleImport}
            disabled={loading || selected.size === 0}
          >
            {loading ? "Importing…" : `Import Selected (${selected.size})`}
          </button>
        </>
      )}

      {result && (
        <p style={{ fontSize: 13, color: "#444", marginTop: 10 }}>
          ✅ Imported {result.imported_count} · Skipped {result.skipped_count} duplicates
          {result.invalid_count > 0 && ` · ${result.invalid_count} invalid`}
        </p>
      )}
    </div>
  );
}
