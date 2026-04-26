"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ParsedPreview {
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  recommendation: string;
  reason: string;
}

const BADGE: Record<string, { label: string; color: string }> = {
  proceed: { label: "✅ proceed", color: "#166534" },
  maybe:   { label: "🟡 maybe",   color: "#92400e" },
  skip:    { label: "❌ skip",    color: "#991b1b" },
};

export default function PasteImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleParse() {
    setLoading(true);
    setError("");
    setPreview(null);
    setDone(false);

    const res = await fetch("/api/import/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setPreview(data);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);
    const res = await fetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobs: [preview] }),
    });
    const data = await res.json();
    setImporting(false);
    if (data.imported_count > 0) {
      setDone(true);
      setPreview(null);
      setText("");
      router.refresh();
    } else if (data.skipped_count > 0) {
      setError("This job is already in your tracker (duplicate URL).");
    } else {
      setError("Import failed — job may be missing a URL.");
    }
  }

  return (
    <div className="form-card" style={{ maxWidth: 680, width: "100%", boxSizing: "border-box" }}>
      <h2>Paste Job Text</h2>
      <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>
        Paste a job description, LinkedIn post, or job alert email. The app will parse it for you.
      </p>

      <textarea
        rows={8}
        style={{ width: "100%", marginBottom: 10, fontFamily: "inherit", fontSize: 13 }}
        placeholder="Paste job text here..."
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setDone(false); setError(""); }}
      />

      <button
        className="submit-btn"
        onClick={handleParse}
        disabled={loading || !text.trim()}
      >
        {loading ? "Parsing…" : "Parse"}
      </button>

      {error && <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>{error}</p>}

      {preview && (
        <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ marginBottom: 10, fontSize: 13, fontWeight: 600 }}>Preview — edit before importing</div>

          {(["title", "company", "location", "url"] as const).map((field) => (
            <div key={field} style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12, color: "#555", display: "block", marginBottom: 2 }}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                style={{ width: "100%", marginBottom: 0 }}
                value={preview[field]}
                onChange={(e) => setPreview({ ...preview, [field]: e.target.value })}
              />
            </div>
          ))}

          <div style={{ marginTop: 8, fontSize: 12 }}>
            <span style={{ color: BADGE[preview.recommendation]?.color ?? "#555", fontWeight: 500 }}>
              {BADGE[preview.recommendation]?.label ?? preview.recommendation}
            </span>
            <span style={{ color: "#888", marginLeft: 8, fontStyle: "italic" }}>{preview.reason}</span>
          </div>

          <button
            className="submit-btn"
            style={{ marginTop: 12 }}
            onClick={handleImport}
            disabled={importing || !preview.title}
          >
            {importing ? "Importing…" : "Import This Job"}
          </button>
        </div>
      )}

      {done && (
        <p style={{ fontSize: 13, color: "#166534", marginTop: 10 }}>✅ Job imported successfully.</p>
      )}
    </div>
  );
}
