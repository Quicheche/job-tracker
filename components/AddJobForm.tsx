"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      company: (form.company as unknown as HTMLInputElement).value,
      title: (form.title as unknown as HTMLInputElement).value,
      location: (form.location as unknown as HTMLInputElement).value,
      url: (form.url as unknown as HTMLInputElement).value,
      description: (form.description as unknown as HTMLTextAreaElement).value,
      score: (form.score as unknown as HTMLInputElement).value
        ? Number((form.score as unknown as HTMLInputElement).value)
        : null,
      notes: (form.notes as unknown as HTMLTextAreaElement).value,
    };

    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    form.reset();
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="form-card">
      <h2>Add Job</h2>
      <form onSubmit={handleSubmit}>
        <input name="company" placeholder="Company *" required />
        <input name="title" placeholder="Title *" required />
        <input name="location" placeholder="Location" />
        <input name="url" placeholder="Job URL" />
        <textarea name="description" placeholder="Description" rows={3} />
        <input name="score" placeholder="Score (1–10)" type="number" min={1} max={10} />
        <textarea name="notes" placeholder="Notes" rows={2} />
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding…" : "Add Job"}
        </button>
      </form>
    </div>
  );
}
