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

/** Offer a download when no subscribed service carries the movie. */
export function shouldOfferDownload(s: AvailabilityStatus): boolean {
  return s.kind !== "streaming";
}
