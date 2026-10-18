import type { Providers } from "@/db/schema";

export type AvailabilityStatus =
  | { kind: "streaming"; services: string[] }
  | { kind: "other-streaming"; services: string[] }
  | { kind: "rent-buy" }
  | { kind: "none" };

/**
 * `subscribed` holds provider ids the household pays for.
 * If it is empty we treat every flatrate provider as relevant.
 */
export function classify(p: Providers, subscribed: number[]): AvailabilityStatus {
  const mine = p.flatrate.filter((x) => subscribed.includes(x.id));
  if (mine.length > 0) return { kind: "streaming", services: mine.map((x) => x.name) };
  if (subscribed.length === 0 && p.flatrate.length > 0) {
    return { kind: "streaming", services: p.flatrate.map((x) => x.name) };
  }
  if (p.flatrate.length > 0) return { kind: "other-streaming", services: p.flatrate.map((x) => x.name) };
  if (p.rent.length > 0 || p.buy.length > 0) return { kind: "rent-buy" };
  return { kind: "none" };
}

export const EMPTY_PROVIDERS: Providers = { flatrate: [], rent: [], buy: [] };

/** Rows cached before logos were stored have no `logoPath` key and need a refetch. */
export function hasLogos(p: Providers): boolean {
  return [...p.flatrate, ...p.rent, ...p.buy].every((x) => "logoPath" in x);
}

/** Subscribed services first, then TMDB's own order. */
export function sortProviders<T extends { id: number }>(list: T[], subscribed: number[]): T[] {
  return [...list].sort((a, b) => Number(subscribed.includes(b.id)) - Number(subscribed.includes(a.id)));
}
