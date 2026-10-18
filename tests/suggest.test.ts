import { describe, it, expect } from "vitest";
import { buildGenreAffinity, scoreCandidates } from "@/lib/suggest";

describe("suggest", () => {
  it("weights liked genres higher", () => {
    const aff = buildGenreAffinity([{ genres: ["Sci-Fi"], rating: 5 }, { genres: ["Horror"], rating: 1 }], []);
    expect(aff["Sci-Fi"]).toBeGreaterThan(aff["Horror"]);
  });

  it("excludes watched, merges seeds, ranks by taste", () => {
    const taste = { genreAffinity: { "Sci-Fi": 3, Drama: 1 }, exclude: new Set([99]) };
    const out = scoreCandidates(
      [
        { tmdbId: 1, title: "A", genres: ["Sci-Fi"], popularity: 50, becauseOf: ["X"] },
        { tmdbId: 1, title: "A", genres: ["Sci-Fi"], popularity: 50, becauseOf: ["Y"] },
        { tmdbId: 2, title: "B", genres: ["Drama"], popularity: 50, becauseOf: ["X"] },
        { tmdbId: 99, title: "Seen", genres: ["Sci-Fi"], popularity: 500, becauseOf: ["X"] },
      ],
      taste,
    );
    expect(out.map((o) => o.tmdbId)).toEqual([1, 2]);
    expect(out[0].reason).toBe("Because you liked X and Y");
  });
});
