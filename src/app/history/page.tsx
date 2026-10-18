import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { requireMember } from "@/lib/auth";
import { Poster } from "@/components/Poster";
import { logPastWatch } from "../actions";

export default async function HistoryPage() {
  await requireMember();
  const members = new Map(db.select().from(schema.members).all().map((m) => [m.id, m]));
  const rows = db
    .select({ ev: schema.watchEvents, movie: schema.movies })
    .from(schema.watchEvents)
    .innerJoin(schema.movies, eq(schema.movies.tmdbId, schema.watchEvents.tmdbId))
    .orderBy(desc(schema.watchEvents.watchedOn), desc(schema.watchEvents.id))
    .all();

  const genreCounts: Record<string, number> = {};
  const pickCounts: Record<string, number> = {};
  for (const { ev, movie } of rows) {
    for (const g of movie.genres) genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    const p = ev.pickedBy ? members.get(ev.pickedBy)?.name : null;
    if (p) pickCounts[p] = (pickCounts[p] ?? 0) + 1;
  }
  const top = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(", ") || "-";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Watch history</h1>
      <section className="card text-sm">
        <b>{rows.length}</b> movies watched. Top genres: {top(genreCounts)}. Picks by: {top(pickCounts)}.
      </section>

      <details className="card">
        <summary className="cursor-pointer">Log a movie you already watched</summary>
        <form action={logPastWatch} className="mt-3 flex flex-wrap items-end gap-2 text-sm">
          <input name="tmdbId" type="number" placeholder="TMDB id" className="input w-32" required />
          <input name="date" type="date" className="input" />
          <input name="rating" type="number" min={1} max={5} placeholder="Rating" className="input w-24" />
          <button className="btn">Log</button>
        </form>
        <p className="mt-2 text-xs text-zinc-500">Tip: the TMDB id is the number in a movie&apos;s themoviedb.org URL.</p>
      </details>

      <ul className="space-y-2">
        {rows.length === 0 && <li className="text-zinc-400">Nothing watched yet. Mark a pick as watched on the Tonight page.</li>}
        {rows.map(({ ev, movie }) => (
          <li key={ev.id} className="card flex gap-3">
            <Poster path={movie.posterPath} title={movie.title} />
            <div className="text-sm">
              <div className="font-medium">{movie.title} <span className="text-zinc-500">({movie.year})</span></div>
              <div className="text-zinc-400">
                {ev.watchedOn}
                {ev.pickedBy && members.get(ev.pickedBy) && <> · picked by {members.get(ev.pickedBy)!.name}</>}
              </div>
              <div className="text-zinc-400">
                {Object.entries(ev.ratings).map(([id, r]) => `${members.get(Number(id))?.name ?? "?"}: ${"★".repeat(r)}`).join("  ")}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
