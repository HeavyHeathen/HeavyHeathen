"use client";
import { useState, useTransition } from "react";
import { addToWishlist } from "@/app/actions";
import type { Providers } from "@/db/schema";
import { ProviderLogos } from "./ProviderLogos";

interface Result {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  providers: Providers | null;
  subscribed: number[];
  region: string;
}

export function MovieSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [pending, start] = useTransition();

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const body = await res.json();
      if (!res.ok) return setError(body.error ?? "Search failed");
      setResults(body.results);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={search} className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for a movie…" className="input flex-1" />
        <button className="btn" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
      </form>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {results && results.length === 0 && <p className="text-sm text-zinc-400">No movies found.</p>}
      <ul className="space-y-3">
        {results?.map((r) => (
          <li key={r.tmdbId} className="flex gap-3 rounded-xl bg-zinc-950/60 p-3">
            {r.posterPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://image.tmdb.org/t/p/w154${r.posterPath}`} alt="" className="h-28 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="h-28 w-20 shrink-0 rounded-lg bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="font-medium">
                {r.title} {r.year && <span className="text-zinc-500">({r.year})</span>}
              </div>
              {r.providers ? (
                <ProviderLogos providers={r.providers} subscribed={r.subscribed} region={r.region} />
              ) : (
                <p className="text-xs text-zinc-500">Streaming info unavailable right now</p>
              )}
            </div>
            <button
              className="btn self-start"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await addToWishlist(r.tmdbId);
                  setResults((x) => x && x.filter((y) => y.tmdbId !== r.tmdbId));
                })
              }
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
