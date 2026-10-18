import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { requireMember } from "@/lib/auth";
import { availabilityFor, membersByIds, watchedIds, wishlistFor } from "@/lib/data";
import { currentTurn, defaultPick } from "@/lib/rotation";
import { loadRotation } from "@/lib/rotation-store";
import { JustWatchCredit, ProviderLogos } from "@/components/ProviderLogos";
import { Poster } from "@/components/Poster";
import { markWatched, planPick, skipTurnAction } from "./actions";

export default async function Tonight() {
  await requireMember();
  const state = loadRotation();
  const turnId = currentTurn(state);
  if (turnId === null) return <p>No members yet. Ask the admin to add some.</p>;

  const [turnMember] = membersByIds([turnId]);
  const members = db.select().from(schema.members).all();
  const planned = db
    .select({ pick: schema.rotationPicks, movie: schema.movies })
    .from(schema.rotationPicks)
    .innerJoin(schema.movies, eq(schema.movies.tmdbId, schema.rotationPicks.tmdbId))
    .where(eq(schema.rotationPicks.status, "planned"))
    .orderBy(desc(schema.rotationPicks.id))
    .get();

  const wl = wishlistFor(turnId);
  const seen = watchedIds();
  const suggested = defaultPick(wl.map((r) => r.item.tmdbId), seen);
  const upNext = state.order.filter((id) => id !== turnId).map((id) => members.find((m) => m.id === id)!).filter(Boolean);
  const avail = planned ? await availabilityFor(planned.movie.tmdbId) : null;

  return (
    <div className="space-y-6">
      <section className="card">
        <p className="text-sm text-zinc-400">Tonight is</p>
        <h1 className="text-3xl font-bold">{turnMember.avatar} {turnMember.name}&apos;s pick</h1>
        {state.owed.includes(turnId) && <p className="mt-1 text-sm text-amber-400">Making up a missed turn</p>}
        <p className="mt-1 text-sm text-zinc-400">
          Then: {upNext.map((m) => m.name).join(" → ") || "nobody else yet"}
        </p>
      </section>

      {planned ? (
        <section className="card flex flex-col gap-4 sm:flex-row">
          <Poster path={planned.movie.posterPath} title={planned.movie.title} className="h-48 w-32" />
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-semibold">{planned.movie.title} <span className="text-zinc-500">({planned.movie.year})</span></h2>
            {avail && <ProviderLogos providers={avail.providers} subscribed={avail.subscribed} region={avail.region} />}
            <p className="text-sm text-zinc-300">{planned.movie.overview}</p>
            <form action={markWatched} className="space-y-2">
              <input type="hidden" name="pickId" value={planned.pick.id} />
              <p className="text-sm text-zinc-400">Who watched? Rate it (1-5, optional)</p>
              {members.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="attendees" value={m.id} defaultChecked />
                  <span className="w-24">{m.avatar} {m.name}</span>
                  <input name={`rating_${m.id}`} type="number" min={1} max={5} className="input w-16" />
                </label>
              ))}
              <button className="btn">Mark watched</button>
            </form>
          </div>
        </section>
      ) : (
        <section className="card space-y-3">
          <h2 className="font-semibold">Choose from {turnMember.name}&apos;s wishlist</h2>
          {wl.length === 0 && <p className="text-zinc-400">Wishlist is empty. Add some movies first.</p>}
          {wl.map(({ item, movie }) => (
            <div key={item.tmdbId} className="flex items-center gap-3">
              <Poster path={movie.posterPath} title={movie.title} />
              <div className="flex-1">
                <div className="font-medium">{movie.title} {movie.year && <span className="text-zinc-500">({movie.year})</span>}</div>
                {item.tmdbId === suggested && <span className="text-xs text-amber-400">Top of the list</span>}
                {seen.has(item.tmdbId) && <span className="text-xs text-zinc-500">Already watched</span>}
              </div>
              <form action={planPick.bind(null, item.tmdbId)}><button className="btn">Pick</button></form>
            </div>
          ))}
        </section>
      )}

      <JustWatchCredit />

      <form action={skipTurnAction}>
        <button className="btn-ghost">{turnMember.name} isn&apos;t here, skip (they keep their turn)</button>
      </form>
    </div>
  );
}
