import { describe, it, expect } from "vitest";
import { topTrailers, watchVideosUrl, pickBestTrailer } from "@/lib/playlist";

describe("playlist", () => {
  it("fills to 5 by skipping movies without trailers", async () => {
    const keys: Record<number, string | null> = { 1: "a", 2: null, 3: "c", 4: "d", 5: null, 6: "f", 7: "g", 8: "h" };
    const out = await topTrailers([1, 2, 3, 4, 5, 6, 7, 8], async (id) => keys[id] ?? null);
    expect(out.map((o) => o.youtubeKey)).toEqual(["a", "c", "d", "f", "g"]);
  });

  it("builds watch_videos url", () => {
    expect(watchVideosUrl(["a", "b"])).toBe("https://www.youtube.com/watch_videos?video_ids=a,b");
  });

  it("prefers official, newest YouTube trailers", () => {
    const k = pickBestTrailer([
      { key: "x", site: "Vimeo", type: "Trailer", official: true },
      { key: "old", site: "YouTube", type: "Trailer", official: true, published_at: "2020-01-01" },
      { key: "new", site: "YouTube", type: "Trailer", official: true, published_at: "2022-01-01" },
      { key: "fan", site: "YouTube", type: "Trailer", official: false, published_at: "2024-01-01" },
    ]);
    expect(k).toBe("new");
    expect(pickBestTrailer([])).toBeNull();
  });
});
