import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { syncMembers, type RotationState } from "./rotation";

export function loadRotation(): RotationState {
  const row = db.select().from(schema.rotationState).where(eq(schema.rotationState.id, 1)).get();
  return row ? { order: row.order, cursor: row.cursor, owed: row.owed } : { order: [], cursor: 0, owed: [] };
}

export function saveRotation(s: RotationState) {
  db.insert(schema.rotationState)
    .values({ id: 1, ...s })
    .onConflictDoUpdate({ target: schema.rotationState.id, set: s })
    .run();
}

export function syncRotation() {
  const ids = db.select({ id: schema.members.id }).from(schema.members).all().map((m) => m.id);
  saveRotation(syncMembers(loadRotation(), ids));
}
