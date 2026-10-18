/* eslint-disable @next/next/no-img-element */
import type { Provider, Providers } from "@/db/schema";
import { sortProviders } from "@/lib/availability";

function Tile({ p, mine }: { p: Provider; mine: boolean }) {
  return p.logoPath ? (
    <img
      src={`https://image.tmdb.org/t/p/w92${p.logoPath}`}
      alt={p.name}
      title={p.name}
      loading="lazy"
      className={`h-10 w-10 rounded-xl object-cover shadow-md transition hover:-translate-y-0.5 ${
        mine ? "ring-2 ring-amber-400" : "ring-1 ring-white/10 opacity-80 hover:opacity-100"
      }`}
    />
  ) : (
    <span
      title={p.name}
      className={`flex h-10 min-w-10 items-center justify-center rounded-xl bg-zinc-800 px-2 text-xs ${
        mine ? "ring-2 ring-amber-400" : "ring-1 ring-white/10"
      }`}
    >
      {p.name}
    </span>
  );
}

function Group({ label, list, subscribed }: { label: string; list: Provider[]; subscribed: number[] }) {
  if (list.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {sortProviders(list, subscribed).map((p) => (
          <Tile key={p.id} p={p} mine={subscribed.includes(p.id)} />
        ))}
      </div>
    </div>
  );
}

export function ProviderLogos({
  providers,
  subscribed,
  region,
  compact = false,
}: {
  providers: Providers;
  subscribed: number[];
  region: string;
  /** Only show streaming (subscription) services */
  compact?: boolean;
}) {
  const { flatrate, rent, buy } = providers;
  const none = flatrate.length + rent.length + buy.length === 0;
  const body = none ? (
    <p className="text-xs text-zinc-500">Not streaming anywhere in {region}</p>
  ) : (
    <div className="space-y-1.5">
      <Group label="Stream" list={flatrate} subscribed={subscribed} />
      {!compact && <Group label="Rent" list={rent} subscribed={subscribed} />}
      {!compact && <Group label="Buy" list={buy} subscribed={subscribed} />}
      {compact && flatrate.length === 0 && <p className="text-xs text-zinc-500">Not on a streaming service</p>}
    </div>
  );
  return providers.link ? (
    <a href={providers.link} target="_blank" rel="noopener noreferrer" className="block">
      {body}
    </a>
  ) : (
    body
  );
}

export function JustWatchCredit() {
  return <p className="text-xs text-zinc-500">Streaming data by JustWatch</p>;
}
