"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PreviewJob, LocationFilter, LevelFilter } from "@/lib/import";

const PRESETS = ["stripe", "airbnb", "coinbase", "sigma"];
const WATCHLIST_KEY = "job-tracker-watchlist";
const SEEN_KEY = "job-tracker-seen-urls";

type FreshWindow = "new" | "24h" | "7d";
type SeenMap = Record<string, { seenAt: number }>;

const BADGE: Record<string, { label: string; color: string }> = {
  proceed: { label: "✅ proceed", color: "#166534" },
  maybe:   { label: "🟡 maybe",   color: "#92400e" },
  skip:    { label: "❌ skip",    color: "#991b1b" },
};

function loadSeen(): SeenMap {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "{}"); } catch { return {}; }
}

function markSeen(urls: string[]) {
  const seen = loadSeen();
  const now = Date.now();
  for (const url of urls) {
    if (!seen[url]) seen[url] = { seenAt: now };
  }
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

export default function WatchlistImport() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("us");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [freshWindow, setFreshWindow] = useState<FreshWindow>("new");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewJob[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported_count: number; skipped_count: number; invalid_count: number } | null>(null);
  const [refreshed, setRefreshed] = useState(false);
  const [targetCompany, setTargetCompany] = useState("all");
  const [clearedMsg, setClearedMsg] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    setWatchlist(stored ? JSON.parse(stored) : PRESETS);
  }, []);

  function saveWatchlist(list: string[]) {
    setWatchlist(list);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  }

  function addSlug(slug: string) {
    const clean = slug.trim().toLowerCase();
    if (!clean || watchlist.includes(clean)) return;
    saveWatchlist([...watchlist, clean]);
  }

  function removeSlug(slug: string) {
    saveWatchlist(watchlist.filter((s) => s !== slug));
  }

  function clearSeen() {
    localStorage.removeItem(SEEN_KEY);
    setPreview([]);
    setSelected(new Set());
    setRefreshed(false);
    setClearedMsg(true);
    setTimeout(() => setClearedMsg(false), 3000);
  }

  async function handleRefresh() {
    setLoading(true);
    setPreview([]);
    setSelected(new Set());
    setErrors([]);
    setResult(null);
    setRefreshed(false);
    const seenUrls = loadSeen();
    const slugsToFetch = targetCompany === "all" ? watchlist : [targetCompany];
    const res = await fetch("/api/import/watchlist-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: slugsToFetch, locationFilter, levelFilter, freshWindow, seenUrls }),
    });
    const data = await res.json();
    setLoading(false);

    const jobs: PreviewJob[] = data.jobs ?? [];
    setErrors(data.errors ?? []);
    setPreview(jobs);
    setRefreshed(true);
    markSeen(jobs.map((j) => j.url));
    setSelected(new Set(
      jobs.map((_, i) => i).filter((i) => jobs[i].recommendation === "proceed")
    ));
  }

  function toggle(i: number) {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === preview.length) setSelected(new Set());
    else setSelected(new Set(preview.map((_, i) => i)));
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
    router.refresh();
  }

  // No post-refresh filter needed — company selection happens before refresh

  return (
    <div className="form-card" style={{ maxWidth: 680, width: "100%", boxSizing: "border-box" }}>
      <h2>Watchlist</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
        Track Greenhouse companies. Refresh to discover fresh IC SDE/backend roles you haven't seen yet.
      </p>

      {/* Presets */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {PRESETS.map((p) => (
          <button key={p} className="filter-btn" onClick={() => addSlug(p)} disabled={watchlist.includes(p)}>
            + {p}
          </button>
        ))}
      </div>

      {/* Add custom slug */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          style={{ flex: 1, minWidth: 0, marginBottom: 0 }}
          placeholder="Add company slug (e.g. dropbox)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { addSlug(input); setInput(""); } }}
        />
        <button
          className="submit-btn"
          style={{ width: "auto", flexShrink: 0, padding: "8px 14px" }}
          onClick={() => { addSlug(input); setInput(""); }}
          disabled={!input.trim()}
        >Add</button>
      </div>

      {/* Watchlist tags */}
      {watchlist.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {watchlist.map((slug) => (
            <span key={slug} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 10px", background: "#f0f0f0", borderRadius: 20, fontSize: 13,
            }}>
              {slug}
              <button onClick={() => removeSlug(slug)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 14, lineHeight: 1 }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Company:</label>
          <select className="row-select" style={{ width: "auto" }} value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}>
            <option value="all">All companies</option>
            {watchlist.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Fresh:</label>
          <select className="row-select" style={{ width: "auto" }} value={freshWindow}
            onChange={(e) => setFreshWindow(e.target.value as FreshWindow)}>
            <option value="new">New (unseen)</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Location:</label>
          <select className="row-select" style={{ width: "auto" }} value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as LocationFilter)}>
            <option value="us">US only</option>
            <option value="europe">Europe only</option>
            <option value="canada">Canada only</option>
            <option value="any">Any location</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <label style={{ fontSize: 13, color: "#555" }}>Level:</label>
          <select className="row-select" style={{ width: "auto" }} value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}>
            <option value="all">All levels</option>
            <option value="mid">Mid level</option>
            <option value="senior">Senior+</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button className="submit-btn" style={{ width: "auto" }} onClick={handleRefresh} disabled={loading || watchlist.length === 0}>
          {loading ? "Refreshing…" : "Refresh Watchlist"}
        </button>
        <button className="save-btn" onClick={clearSeen}>Clear Seen Jobs</button>
      </div>
      {clearedMsg && <p style={{ fontSize: 13, color: "#166534", marginTop: 6 }}>Seen jobs cleared.</p>}

      {errors.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {errors.map((e, i) => <p key={i} style={{ color: "#b45309", fontSize: 12 }}>⚠️ {e}</p>)}
        </div>
      )}

      {refreshed && preview.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: "#888", marginTop: 10 }}>No new jobs found — you're up to date.</p>
      )}

      {preview.length > 0 && (
        <>
          {/* Results header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 8px", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#555" }}>{preview.length} fresh jobs</span>
            <button className="filter-btn" onClick={toggleAll}>
              {selected.size === preview.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          {/* Job list */}
          <div style={{ border: "1px solid #eee", borderRadius: 6, overflow: "hidden", marginBottom: 12, width: "100%" }}>
            {preview.map((job, i) => (
              <label key={i} style={{
                display: "grid", gridTemplateColumns: "20px 1fr", gap: 10,
                padding: "10px 12px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                background: selected.has(i) ? "#fafafa" : "#fff",
                boxSizing: "border-box", width: "100%",
              }}>
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} style={{ marginTop: 3 }} />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                    {job.title}
                    {job.sponsorship && <span style={{ marginLeft: 6 }}>💼</span>}
                    <span style={{ marginLeft: 8, fontSize: 12, color: BADGE[job.recommendation]?.color }}>
                      {BADGE[job.recommendation]?.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                    {job.company} · {job.location || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 3, fontStyle: "italic" }}>{job.reason}</div>
                  <a href={job.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#0070f3", display: "block", overflowWrap: "break-word", wordBreak: "break-all" }}
                    onClick={(e) => e.stopPropagation()}>
                    {job.url}
                  </a>
                </div>
              </label>
            ))}
          </div>

          <button className="submit-btn" onClick={handleImport} disabled={loading || selected.size === 0}>
            {loading ? "Importing…" : `Import Selected (${selected.size})`}
          </button>
          <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
            All {preview.length} jobs above are marked as seen. Import is optional.
          </p>
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
