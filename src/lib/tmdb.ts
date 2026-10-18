import { pickBestTrailer } from "./playlist";
import type { Providers } from "@/db/schema";

const BASE = process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3";

function key() {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY is not set");
  return k;
}

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", key());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface MovieSummary {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  genres: string[];
  runtime: number | null;
  popularity: number;
}

interface RawMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  popularity: number;
}

let genreMap: Map<number, string> | null = null;
async function genres() {
  if (!genreMap) {
    const r = await get<{ genres: { id: number; name: string }[] }>("/genre/movie/list");
    genreMap = new Map(r.genres.map((g) => [g.id, g.name]));
  }
  return genreMap;
}

async function normalize(m: RawMovie): Promise<MovieSummary> {
  const gm = await genres();
  return {
    tmdbId: m.id,
    title: m.title,
    year: m.release_date ? Number(m.release_date.slice(0, 4)) || null : null,
    posterPath: m.poster_path,
    overview: m.overview,
    genres: m.genres ? m.genres.map((g) => g.name) : (m.genre_ids ?? []).map((i) => gm.get(i)).filter((x): x is string => !!x),
    runtime: m.runtime ?? null,
    popularity: m.popularity,
  };
}

export async function searchMovies(q: string): Promise<MovieSummary[]> {
  const r = await get<{ results: RawMovie[] }>("/search/movie", { query: q, include_adult: "false" });
  return Promise.all(r.results.slice(0, 12).map(normalize));
}

export async function getMovie(id: number): Promise<MovieSummary> {
  return normalize(await get<RawMovie>(`/movie/${id}`));
}

export async function getRelated(id: number): Promise<MovieSummary[]> {
  const [rec, sim] = await Promise.all([
    get<{ results: RawMovie[] }>(`/movie/${id}/recommendations`),
    get<{ results: RawMovie[] }>(`/movie/${id}/similar`),
  ]);
  return Promise.all([...rec.results, ...sim.results].slice(0, 30).map(normalize));
}

export async function getTrailerKey(id: number): Promise<string | null> {
  const r = await get<{ results: Parameters<typeof pickBestTrailer>[0] }>(`/movie/${id}/videos`);
  return pickBestTrailer(r.results);
}

export async function getProviders(id: number, region: string): Promise<Providers> {
  const r = await get<{
    results: Record<string, { link?: string; flatrate?: P[]; rent?: P[]; buy?: P[] }>;
  }>(`/movie/${id}/watch/providers`);
  type P = { provider_id: number; provider_name: string };
  const x = r.results[region] ?? {};
  const map = (a?: P[]) => (a ?? []).map((p) => ({ id: p.provider_id, name: p.provider_name }));
  return { flatrate: map(x.flatrate), rent: map(x.rent), buy: map(x.buy), link: x.link };
}

export async function listProviders(region: string): Promise<{ id: number; name: string }[]> {
  const r = await get<{ results: { provider_id: number; provider_name: string }[] }>(
    "/watch/providers/movie",
    { watch_region: region },
  );
  return r.results.map((p) => ({ id: p.provider_id, name: p.provider_name }));
}
