"use client";
import { useState, useTransition } from "react";
import { addToWishlist } from "@/app/actions";

interface Result { tmdbId: number; title: string; year: number | null; posterPath: string | null }

export function MovieSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const body = await res.json();
    if (!res.ok) return setError(body.error ?? "Search failed");
    setResults(body);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a movie…" className="input flex-1" />
        <button className="btn">Search</button>
      </form>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <ul className="space-y-2">
        {results.map((r) => (
          <li key={r.tmdbId} className="flex items-center justify-between gap-3 text-sm">
            <span>{r.title} {r.year && <span className="text-zinc-500">({r.year})</span>}</span>
            <button
              className="btn"
              disabled={pending}
              onClick={() => start(async () => { await addToWishlist(r.tmdbId); setResults((x) => x.filter((y) => y.tmdbId !== r.tmdbId)); })}
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
