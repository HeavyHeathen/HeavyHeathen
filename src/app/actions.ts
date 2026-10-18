"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { checkPin, endSession, hashPin, requireAdmin, requireMember, startSession } from "@/lib/auth";
import { ensureMovie, getSetting, setSetting, trailerFor, wishlistFor } from "@/lib/data";
import { loadRotation, saveRotation, syncRotation } from "@/lib/rotation-store";
import { dispatchApproved } from "@/lib/downloads";
import { completeTurn, currentTurn, skipTurn as skip } from "@/lib/rotation";
import { topTrailers, watchVideosUrl } from "@/lib/playlist";
import type { RadarrConfig } from "@/lib/radarr";

/* ---------- accounts ---------- */

export async function login(formData: FormData) {
  const id = Number(formData.get("memberId"));
  const pin = String(formData.get("pin") ?? "");
  const m = db.select().from(schema.members).where(eq(schema.members.id, id)).get();
  if (!m) redirect("/login");
  if (m.pinHash && !(await checkPin(pin, m.pinHash))) redirect(`/login?error=pin&member=${id}`);
  await startSession(m.id);
  redirect("/");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

export async function setupFirstAdmin(formData: FormData) {
  const count = db.select({ n: sql<number>`count(*)` }).from(schema.members).get()!.n;
  if (count > 0) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/login");
  const pin = String(formData.get("pin") ?? "");
  const row = db
    .insert(schema.members)
    .values({ name, isAdmin: true, pinHash: pin ? await hashPin(pin) : null })
    .returning()
    .get();
  syncRotation();
  await startSession(row.id);
  redirect("/admin");
}

export async function addMemberAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const pin = String(formData.get("pin") ?? "");
  const avatar = String(formData.get("avatar") ?? "").trim() || "🎬";
  db.insert(schema.members).values({ name, avatar, pinHash: pin ? await hashPin(pin) : null }).run();
  syncRotation();
  revalidatePath("/admin");
}

export async function removeMemberAction(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (id === me.id) return;
  db.delete(schema.members).where(eq(schema.members.id, id)).run();
  syncRotation();
  revalidatePath("/admin");
}

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  setSetting("region", String(formData.get("region") ?? "US").toUpperCase());
  setSetting(
    "subscribed",
    String(formData.get("subscribed") ?? "").split(",").map((s) => Number(s.trim())).filter(Boolean),
  );
  setSetting("requireApproval", formData.get("requireApproval") === "on");
  const url = String(formData.get("radarrUrl") ?? "").trim();
  if (url) {
    setSetting("radarr", {
      url,
      apiKey: String(formData.get("radarrKey") ?? ""),
      qualityProfileId: Number(formData.get("radarrProfile") ?? 1),
      rootFolder: String(formData.get("radarrRoot") ?? "/data/movies"),
    } satisfies RadarrConfig);
  }
  revalidatePath("/", "layout");
}

/* ---------- wishlist ---------- */

export async function addToWishlist(tmdbId: number) {
  const me = await requireMember();
  await ensureMovie(tmdbId);
  const max = db
    .select({ m: sql<number>`coalesce(max(position), -1)` })
    .from(schema.wishlistItems)
    .where(eq(schema.wishlistItems.memberId, me.id))
    .get()!.m;
  db.insert(schema.wishlistItems)
    .values({ memberId: me.id, tmdbId, position: max + 1, addedAt: Date.now() })
    .onConflictDoNothing()
    .run();
  revalidatePath("/wishlist");
}

export async function removeFromWishlist(tmdbId: number) {
  const me = await requireMember();
  db.delete(schema.wishlistItems)
    .where(and(eq(schema.wishlistItems.memberId, me.id), eq(schema.wishlistItems.tmdbId, tmdbId)))
    .run();
  compact(me.id);
  revalidatePath("/wishlist");
}

export async function reorderWishlist(orderedTmdbIds: number[]) {
  const me = await requireMember();
  db.transaction((tx) => {
    orderedTmdbIds.forEach((tmdbId, position) => {
      tx.update(schema.wishlistItems)
        .set({ position })
        .where(and(eq(schema.wishlistItems.memberId, me.id), eq(schema.wishlistItems.tmdbId, tmdbId)))
        .run();
    });
  });
  revalidatePath("/wishlist");
}

function compact(memberId: number) {
  wishlistFor(memberId).forEach((r, i) => {
    if (r.item.position !== i)
      db.update(schema.wishlistItems)
        .set({ position: i })
        .where(and(eq(schema.wishlistItems.memberId, memberId), eq(schema.wishlistItems.tmdbId, r.item.tmdbId)))
        .run();
  });
}

/* ---------- trailers ---------- */

export async function trailerPlaylist(): Promise<{ url: string; count: number } | { error: string }> {
  const me = await requireMember();
  const ids = wishlistFor(me.id).map((r) => r.item.tmdbId);
  const tops = await topTrailers(ids, trailerFor, 5);
  if (tops.length === 0) return { error: "No trailers found for your wishlist yet." };
  return { url: watchVideosUrl(tops.map((t) => t.youtubeKey)), count: tops.length };
}

/* ---------- rotation ---------- */

export async function planPick(tmdbId: number) {
  await requireMember();
  const turn = currentTurn(loadRotation());
  if (turn === null) return;
  await ensureMovie(tmdbId);
  db.update(schema.rotationPicks).set({ status: "cancelled" }).where(eq(schema.rotationPicks.status, "planned")).run();
  db.insert(schema.rotationPicks).values({ memberId: turn, tmdbId, createdAt: Date.now() }).run();
  revalidatePath("/");
}

export async function skipTurnAction() {
  await requireMember();
  db.update(schema.rotationPicks).set({ status: "cancelled" }).where(eq(schema.rotationPicks.status, "planned")).run();
  saveRotation(skip(loadRotation()));
  revalidatePath("/");
}

export async function markWatched(formData: FormData) {
  await requireMember();
  const pickId = Number(formData.get("pickId"));
  const pick = db.select().from(schema.rotationPicks).where(eq(schema.rotationPicks.id, pickId)).get();
  if (!pick || pick.status !== "planned") return;
  const attendees = formData.getAll("attendees").map(Number);
  const ratings: Record<string, number> = {};
  for (const id of attendees) {
    const r = Number(formData.get(`rating_${id}`));
    if (r >= 1 && r <= 5) ratings[String(id)] = r;
  }
  db.transaction((tx) => {
    tx.insert(schema.watchEvents)
      .values({
        tmdbId: pick.tmdbId,
        watchedOn: new Date().toISOString().slice(0, 10),
        pickedBy: pick.memberId,
        attendees,
        ratings,
        source: "rotation",
      })
      .run();
    tx.update(schema.rotationPicks).set({ status: "watched" }).where(eq(schema.rotationPicks.id, pickId)).run();
    // drop from everyone's wishlist, it's been seen
    tx.delete(schema.wishlistItems).where(eq(schema.wishlistItems.tmdbId, pick.tmdbId)).run();
  });
  for (const m of db.select({ id: schema.members.id }).from(schema.members).all()) compact(m.id);
  saveRotation(completeTurn(loadRotation()));
  revalidatePath("/", "layout");
}

export async function logPastWatch(formData: FormData) {
  const me = await requireMember();
  const tmdbId = Number(formData.get("tmdbId"));
  if (!tmdbId) return;
  await ensureMovie(tmdbId);
  const rating = Number(formData.get("rating"));
  db.insert(schema.watchEvents)
    .values({
      tmdbId,
      watchedOn: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
      pickedBy: me.id,
      attendees: [me.id],
      ratings: rating >= 1 && rating <= 5 ? { [String(me.id)]: rating } : {},
    })
    .run();
  revalidatePath("/history");
}

/* ---------- downloads ---------- */

export async function requestDownload(tmdbId: number) {
  const me = await requireMember();
  await ensureMovie(tmdbId);
  const needsApproval = getSetting<boolean>("requireApproval", true) && !me.isAdmin;
  db.insert(schema.downloadRequests)
    .values({ tmdbId, requestedBy: me.id, status: needsApproval ? "pending" : "approved", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
  if (!needsApproval) await dispatchApproved();
  revalidatePath("/wishlist");
  revalidatePath("/admin");
}

export async function decideDownload(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const approve = formData.get("decision") === "approve";
  db.update(schema.downloadRequests)
    .set({ status: approve ? "approved" : "rejected" })
    .where(eq(schema.downloadRequests.id, id))
    .run();
  if (approve) await dispatchApproved();
  revalidatePath("/admin");
}
