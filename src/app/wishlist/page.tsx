import { requireMember } from "@/lib/auth";
import { availabilityFor, wishlistFor } from "@/lib/data";
import { JustWatchCredit } from "@/components/ProviderLogos";
import { MovieSearch } from "@/components/MovieSearch";
import { TrailerButton } from "@/components/TrailerButton";
import { WishlistList, type Row } from "@/components/WishlistList";

export default async function WishlistPage() {
  const me = await requireMember();
  const rows: Row[] = await Promise.all(
    wishlistFor(me.id).map(async ({ movie }) => {
      const a = await availabilityFor(movie.tmdbId);
      return {
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.year,
        posterPath: movie.posterPath,
        providers: a.providers,
        subscribed: a.subscribed,
        region: a.region,
      };
    }),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{me.name}&apos;s wishlist</h1>
        <TrailerButton />
      </div>
      <section className="card"><MovieSearch /></section>
      <p className="text-sm text-zinc-400">
        Drag to reorder. The top 5 (amber) feed your trailer playlist. Services with an amber ring are ones you subscribe to.
      </p>
      <WishlistList initial={rows} />
      <JustWatchCredit />
    </div>
  );
}
