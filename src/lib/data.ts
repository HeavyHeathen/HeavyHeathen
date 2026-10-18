import { and, eq, asc, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import type { Providers } from "@/db/schema";
import { classify, EMPTY_PROVIDERS, hasLogos, type AvailabilityStatus } from "./availability";
import * as tmdb from "./tmdb";

const DAY = 86_400_000;

export function getSetting<T>(key: string, fallback: T): T {
  const row = db.select().from(schema.settings).where(eq(schema.settings.key, key)).get();
  return row ? (row.value as T) : fallback;
}

export function setSetting(key: string, value: unknown) {
  db.insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
}

export const region = () => getSetting<string>("region", "US");
export const subscribedServices = () => getSetting<number[]>("subscribed", []);

/** Make sure a movie row exists (and is fresh enough). */
export async function ensureMovie(tmdbId: number) {
  const row = db.select().from(schema.movies).where(eq(schema.movies.tmdbId, tmdbId)).get();
  if (row && Date.now() - row.cachedAt < 7 * DAY) return row;
  const m = await tmdb.getMovie(tmdbId);
  const values = { ...m, cachedAt: Date.now() };
  db.insert(schema.movies).values(values).onConflictDoUpdate({ target: schema.movies.tmdbId, set: values }).run();
  return db.select().from(schema.movies).where(eq(schema.movies.tmdbId, tmdbId)).get()!;
}

export interface Availability {
  status: AvailabilityStatus;
  providers: Providers;
  subscribed: number[];
  region: string;
}

export async function availabilityFor(tmdbId: number): Promise<Availability> {
  const r = region();
  const subscribed = subscribedServices();
  const row = db
    .select()
    .from(schema.availabilityCache)
    .where(and(eq(schema.availabilityCache.tmdbId, tmdbId), eq(schema.availabilityCache.region, r)))
    .get();
  let providers = row?.providers;
  if (!row || Date.now() - row.fetchedAt > DAY || !hasLogos(row.providers)) {
    try {
      providers = await tmdb.getProviders(tmdbId, r);
      db.insert(schema.availabilityCache)
        .values({ tmdbId, region: r, providers, fetchedAt: Date.now() })
        .onConflictDoUpdate({
          target: [schema.availabilityCache.tmdbId, schema.availabilityCache.region],
          set: { providers, fetchedAt: Date.now() },
        })
        .run();
    } catch {
      // fall back to stale data if TMDB is unreachable
    }
  }
  const p = providers ?? EMPTY_PROVIDERS;
  return { status: classify(p, subscribed), providers: p, subscribed, region: r };
}

export async function trailerFor(tmdbId: number): Promise<string | null> {
  const row = db.select().from(schema.trailerCache).where(eq(schema.trailerCache.tmdbId, tmdbId)).get();
  if (row && Date.now() - row.fetchedAt < 7 * DAY) return row.youtubeKey;
  const key = await tmdb.getTrailerKey(tmdbId);
  db.insert(schema.trailerCache)
    .values({ tmdbId, youtubeKey: key, fetchedAt: Date.now() })
    .onConflictDoUpdate({ target: schema.trailerCache.tmdbId, set: { youtubeKey: key, fetchedAt: Date.now() } })
    .run();
  return key;
}

export function wishlistFor(memberId: number) {
  return db
    .select({ item: schema.wishlistItems, movie: schema.movies })
    .from(schema.wishlistItems)
    .innerJoin(schema.movies, eq(schema.movies.tmdbId, schema.wishlistItems.tmdbId))
    .where(eq(schema.wishlistItems.memberId, memberId))
    .orderBy(asc(schema.wishlistItems.position))
    .all();
}

export function watchedIds(): Set<number> {
  return new Set(db.select({ id: schema.watchEvents.tmdbId }).from(schema.watchEvents).all().map((r) => r.id));
}

export function membersByIds(ids: number[]) {
  if (ids.length === 0) return [];
  return db.select().from(schema.members).where(inArray(schema.members.id, ids)).all();
}
