import { NextResponse } from "next/server";
import { currentMember } from "@/lib/auth";
import { searchMovies } from "@/lib/tmdb";

export async function GET(req: Request) {
  if (!(await currentMember())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);
  try {
    return NextResponse.json(await searchMovies(q));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
