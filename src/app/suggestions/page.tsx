import { requireMember } from "@/lib/auth";
import { suggestionsFor } from "@/lib/suggestions-service";
import { availabilityFor, ensureMovie } from "@/lib/data";
import { JustWatchCredit, ProviderLogos } from "@/components/ProviderLogos";
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
  const avails = await Promise.all(list.map((s) => availabilityFor(s.tmdbId).catch(() => null)));
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
              <div className="font-medium">{s.title}</div>
              <div className="text-sm text-zinc-400">{s.reason}</div>
              {avails[i] && (
                <div className="mt-1.5">
                  <ProviderLogos providers={avails[i]!.providers} subscribed={avails[i]!.subscribed} region={avails[i]!.region} compact />
                </div>
              )}
            </div>
            <form action={addToWishlist.bind(null, s.tmdbId)}><button className="btn">Add</button></form>
          </li>
        ))}
      </ul>
      <JustWatchCredit />
    </div>
  );
}
