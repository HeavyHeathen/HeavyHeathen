import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const members = sqliteTable("members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  avatar: text("avatar").notNull().default("🎬"),
  pinHash: text("pin_hash"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
});

export const movies = sqliteTable("movies", {
  tmdbId: integer("tmdb_id").primaryKey(),
  title: text("title").notNull(),
  year: integer("year"),
  posterPath: text("poster_path"),
  runtime: integer("runtime"),
  genres: text("genres", { mode: "json" }).$type<string[]>().notNull().default([]),
  overview: text("overview").notNull().default(""),
  cachedAt: integer("cached_at").notNull(),
});

export const wishlistItems = sqliteTable(
  "wishlist_items",
  {
    memberId: integer("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull().references(() => movies.tmdbId),
    position: integer("position").notNull(),
    note: text("note"),
    addedAt: integer("added_at").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.memberId, t.tmdbId] }) }),
);

export const availabilityCache = sqliteTable(
  "availability_cache",
  {
    tmdbId: integer("tmdb_id").notNull(),
    region: text("region").notNull(),
    providers: text("providers", { mode: "json" }).$type<Providers>().notNull(),
    fetchedAt: integer("fetched_at").notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.tmdbId, t.region] }) }),
);

export const trailerCache = sqliteTable("trailer_cache", {
  tmdbId: integer("tmdb_id").primaryKey(),
  youtubeKey: text("youtube_key"),
  fetchedAt: integer("fetched_at").notNull(),
});

export const downloadRequests = sqliteTable(
  "download_requests",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tmdbId: integer("tmdb_id").notNull().references(() => movies.tmdbId),
    requestedBy: integer("requested_by").notNull().references(() => members.id),
    status: text("status", {
      enum: ["pending", "approved", "sent", "downloading", "available", "failed", "rejected"],
    }).notNull().default("pending"),
    radarrId: integer("radarr_id"),
    error: text("error"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => ({ onePerMovie: uniqueIndex("dl_one_per_movie").on(t.tmdbId) }),
);

export const watchEvents = sqliteTable("watch_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdbId: integer("tmdb_id").notNull().references(() => movies.tmdbId),
  watchedOn: text("watched_on").notNull(), // YYYY-MM-DD
  pickedBy: integer("picked_by").references(() => members.id),
  attendees: text("attendees", { mode: "json" }).$type<number[]>().notNull().default([]),
  ratings: text("ratings", { mode: "json" }).$type<Record<string, number>>().notNull().default({}),
  source: text("source").notNull().default("manual"),
});

export const rotationState = sqliteTable("rotation_state", {
  id: integer("id").primaryKey(), // always 1
  order: text("order", { mode: "json" }).$type<number[]>().notNull().default([]),
  cursor: integer("cursor").notNull().default(0),
  owed: text("owed", { mode: "json" }).$type<number[]>().notNull().default([]),
});

export const rotationPicks = sqliteTable("rotation_picks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  memberId: integer("member_id").notNull().references(() => members.id),
  tmdbId: integer("tmdb_id").notNull().references(() => movies.tmdbId),
  status: text("status", { enum: ["planned", "watched", "cancelled"] }).notNull().default("planned"),
  createdAt: integer("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
});

export interface Providers {
  flatrate: { id: number; name: string }[];
  rent: { id: number; name: string }[];
  buy: { id: number; name: string }[];
  link?: string;
}
