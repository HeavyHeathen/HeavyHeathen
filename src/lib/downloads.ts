import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { getSetting } from "./data";
import { addMovie, movieStatus, type RadarrConfig } from "./radarr";

const radarrConfig = () => getSetting<RadarrConfig | null>("radarr", null);

/** Send approved requests to Radarr. */
export async function dispatchApproved() {
  const cfg = radarrConfig();
  if (!cfg) return;
  const rows = db.select().from(schema.downloadRequests).where(eq(schema.downloadRequests.status, "approved")).all();
  for (const r of rows) {
    try {
      const radarrId = await addMovie(cfg, r.tmdbId);
      db.update(schema.downloadRequests).set({ status: "sent", radarrId, error: null }).where(eq(schema.downloadRequests.id, r.id)).run();
    } catch (e) {
      db.update(schema.downloadRequests).set({ status: "failed", error: String(e) }).where(eq(schema.downloadRequests.id, r.id)).run();
    }
  }
}

/** Refresh status for requests already handed to Radarr. */
export async function pollDownloads() {
  const cfg = radarrConfig();
  if (!cfg) return;
  await dispatchApproved();
  const rows = db
    .select()
    .from(schema.downloadRequests)
    .where(inArray(schema.downloadRequests.status, ["sent", "downloading"]))
    .all();
  for (const r of rows) {
    if (r.radarrId == null) continue;
    try {
      const status = await movieStatus(cfg, r.radarrId);
      if (status !== r.status) db.update(schema.downloadRequests).set({ status }).where(eq(schema.downloadRequests.id, r.id)).run();
    } catch {
      // Radarr temporarily down; try again next tick
    }
  }
}
