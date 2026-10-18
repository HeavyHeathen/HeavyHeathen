import { requireMember } from "@/lib/auth";
import { suggestionsFor } from "@/lib/suggestions-service";
import { ensureMovie } from "@/lib/data";
import { Poster } from "@/components/Poster";
import { addToWishlist } from "../actions";

export default async function SuggestionsPage() {
  const me = await requireMember();
  let list: Awaited<ReturnType<typeof suggestionsFor>> = [];
  let error = "";
  try {
    list = await suggestionsFor(me.id);
  } catch (e) {
    error = String(e);
  }
  const movies = await Promise.all(list.map((s) => ensureMovie(s.tmdbId).catch(() => null)));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Suggestions for {me.name}</h1>
      {error && <p className="text-rose-400">{error}</p>}
      {!error && list.length === 0 && <p className="text-zinc-400">Watch a few movies or add to your wishlist and ideas will show up here.</p>}
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={s.tmdbId} className="card flex items-center gap-3">
            <Poster path={movies[i]?.posterPath ?? null} title={s.title} />
            <div className="flex-1">
              <div className="font-medium">{s.title} {s.streamingNow && <span className="ml-1 rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-emerald-200">Streaming</span>}</div>
              <div className="text-sm text-zinc-400">{s.reason}</div>
            </div>
            <form action={addToWishlist.bind(null, s.tmdbId)}><button className="btn">Add</button></form>
          </li>
        ))}
      </ul>
    </div>
  );
}
