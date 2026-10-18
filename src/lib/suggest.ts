export interface Candidate {
  tmdbId: number;
  title: string;
  genres: string[];
  popularity: number;
  /** seed movie titles that led to this candidate */
  becauseOf: string[];
  streamingNow?: boolean;
}

export interface TasteInput {
  /** genre -> weight, built from watch history (rating-weighted) and wishlist */
  genreAffinity: Record<string, number>;
  exclude: Set<number>;
}

export interface Scored extends Candidate {
  score: number;
  reason: string;
}

export function buildGenreAffinity(
  watched: { genres: string[]; rating?: number }[],
  wishlistGenres: string[][],
): Record<string, number> {
  const aff: Record<string, number> = {};
  for (const w of watched) {
    const weight = w.rating ? w.rating / 5 + 0.5 : 1; // unrated = 1, 5 stars = 1.5, 1 star = 0.7
    for (const g of w.genres) aff[g] = (aff[g] ?? 0) + weight;
  }
  for (const gs of wishlistGenres) for (const g of gs) aff[g] = (aff[g] ?? 0) + 0.5;
  return aff;
}

export function scoreCandidates(cands: Candidate[], taste: TasteInput, limit = 20): Scored[] {
  // Merge duplicates so a movie recommended by several seeds ranks higher.
  const merged = new Map<number, Candidate>();
  for (const c of cands) {
    if (taste.exclude.has(c.tmdbId)) continue;
    const prev = merged.get(c.tmdbId);
    if (prev) prev.becauseOf = [...new Set([...prev.becauseOf, ...c.becauseOf])];
    else merged.set(c.tmdbId, { ...c, becauseOf: [...c.becauseOf] });
  }
  const maxAff = Math.max(1, ...Object.values(taste.genreAffinity));
  const scored = [...merged.values()].map((c) => {
    const genreScore = c.genres.length
      ? c.genres.reduce((s, g) => s + (taste.genreAffinity[g] ?? 0) / maxAff, 0) / c.genres.length
      : 0;
    const seedScore = Math.min(c.becauseOf.length, 4) / 4;
    const popScore = Math.min(Math.log10(c.popularity + 1) / 3, 1);
    const stream = c.streamingNow ? 1 : 0;
    const score = 0.4 * seedScore + 0.35 * genreScore + 0.15 * popScore + 0.1 * stream;
    const reason = c.becauseOf.length
      ? `Because you liked ${c.becauseOf.slice(0, 2).join(" and ")}`
      : "Matches your favorite genres";
    return { ...c, score, reason };
  });
  return scored.sort((a, b) => b.score - a.score || a.tmdbId - b.tmdbId).slice(0, limit);
}
