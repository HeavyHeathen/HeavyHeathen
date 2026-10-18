import { db, schema } from "@/db/client";
import { requireMember } from "@/lib/auth";
import { availabilityFor, wishlistFor } from "@/lib/data";
import { shouldOfferDownload } from "@/lib/availability";
import { MovieSearch } from "@/components/MovieSearch";
import { TrailerButton } from "@/components/TrailerButton";
import { WishlistList, type Row } from "@/components/WishlistList";

export default async function WishlistPage() {
  const me = await requireMember();
  const items = wishlistFor(me.id);
  const requests = new Map(db.select().from(schema.downloadRequests).all().map((r) => [r.tmdbId, r.status]));
  const rows: Row[] = await Promise.all(
    items.map(async ({ movie }) => {
      const a = await availabilityFor(movie.tmdbId);
      const badge: Row["badge"] =
        a.kind === "streaming" ? { label: `On ${a.services.join(", ")}`, tone: "good" }
        : a.kind === "other-streaming" ? { label: `Other service: ${a.services.slice(0, 2).join(", ")}`, tone: "info" }
        : a.kind === "rent-buy" ? { label: "Rent / buy only", tone: "neutral" }
        : { label: "Not streaming", tone: "bad" };
      return {
        tmdbId: movie.tmdbId,
        title: movie.title,
        year: movie.year,
        posterPath: movie.posterPath,
        badge,
        canRequest: shouldOfferDownload(a),
        requestStatus: requests.get(movie.tmdbId) ?? null,
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
      <p className="text-sm text-zinc-400">Drag to reorder. The top 5 (amber) feed your trailer playlist.</p>
      <WishlistList initial={rows} />
    </div>
  );
}
