export interface TrailerLookup {
  (tmdbId: number): Promise<string | null>;
}

/** Walk the wishlist in order and collect up to `limit` movies that have a trailer. */
export async function topTrailers(
  tmdbIds: number[],
  lookup: TrailerLookup,
  limit = 5,
): Promise<{ tmdbId: number; youtubeKey: string }[]> {
  const out: { tmdbId: number; youtubeKey: string }[] = [];
  for (const tmdbId of tmdbIds) {
    if (out.length >= limit) break;
    const youtubeKey = await lookup(tmdbId);
    if (youtubeKey) out.push({ tmdbId, youtubeKey });
  }
  return out;
}

export function watchVideosUrl(keys: string[]): string {
  return `https://www.youtube.com/watch_videos?video_ids=${keys.join(",")}`;
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  published_at?: string;
}

/** Prefer official YouTube trailers, newest first. */
export function pickBestTrailer(videos: TmdbVideo[]): string | null {
  const yt = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  yt.sort(
    (a, b) =>
      Number(b.official) - Number(a.official) ||
      (b.published_at ?? "").localeCompare(a.published_at ?? ""),
  );
  return yt[0]?.key ?? null;
}
