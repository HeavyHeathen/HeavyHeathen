import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { availabilityFor, wishlistFor } from "./data";
import { buildGenreAffinity, scoreCandidates, type Candidate, type Scored } from "./suggest";
import { getRelated } from "./tmdb";

const relatedCache = new Map<number, { at: number; data: Awaited<ReturnType<typeof getRelated>> }>();
async function related(id: number) {
  const hit = relatedCache.get(id);
  if (hit && Date.now() - hit.at < 6 * 3_600_000) return hit.data;
  const data = await getRelated(id);
  relatedCache.set(id, { at: Date.now(), data });
  return data;
}

export async function suggestionsFor(memberId: number): Promise<Scored[]> {
  const history = db
    .select({ ev: schema.watchEvents, movie: schema.movies })
    .from(schema.watchEvents)
    .innerJoin(schema.movies, eq(schema.movies.tmdbId, schema.watchEvents.tmdbId))
    .orderBy(desc(schema.watchEvents.watchedOn))
    .all();
  const wl = wishlistFor(memberId);

  const rating = (ev: (typeof history)[number]["ev"]) => {
    const vals = Object.values(ev.ratings);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;
  };
  // seeds: recent or well-rated watches, plus the top of the wishlist
  const watchSeeds = history.filter((h) => (rating(h.ev) ?? 3) >= 3).slice(0, 6).map((h) => h.movie);
  const wishSeeds = wl.slice(0, 4).map((w) => w.movie);

  const cands: Candidate[] = [];
  for (const seed of [...watchSeeds, ...wishSeeds]) {
    try {
      for (const m of await related(seed.tmdbId)) {
        cands.push({ tmdbId: m.tmdbId, title: m.title, genres: m.genres, popularity: m.popularity, becauseOf: [seed.title] });
      }
    } catch {
      // skip a seed TMDB can't resolve
    }
  }

  const taste = {
    genreAffinity: buildGenreAffinity(
      history.map((h) => ({ genres: h.movie.genres, rating: rating(h.ev) })),
      wl.map((w) => w.movie.genres),
    ),
    exclude: new Set([...history.map((h) => h.movie.tmdbId), ...wl.map((w) => w.movie.tmdbId)]),
  };
  const top = scoreCandidates(cands, taste, 12);
  // small availability bonus: re-score only the shortlist to limit TMDB calls
  for (const t of top) t.streamingNow = (await availabilityFor(t.tmdbId).catch(() => null))?.kind === "streaming";
  return scoreCandidates(top, { ...taste, exclude: new Set() }, 12);
}
