import { NextResponse } from "next/server";
import { currentMember } from "@/lib/auth";
import { availabilityFor } from "@/lib/data";
import { searchMovies } from "@/lib/tmdb";

export async function GET(req: Request) {
  if (!(await currentMember())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });
  try {
    const movies = await searchMovies(q);
    // providers are cached for 24h, so repeat searches are cheap
    const results = await Promise.all(
      movies.map(async (m) => {
        const a = await availabilityFor(m.tmdbId).catch(() => null);
        return { ...m, providers: a?.providers ?? null, subscribed: a?.subscribed ?? [], region: a?.region ?? "US" };
      }),
    );
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
