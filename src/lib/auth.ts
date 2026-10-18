import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";

const COOKIE = "mn_session";

function secret() {
  return process.env.SESSION_SECRET ?? "dev-secret-change-me";
}
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

export async function startSession(memberId: number) {
  const v = String(memberId);
  (await cookies()).set(COOKIE, `${v}.${sign(v)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function currentMember() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [v, sig] = raw.split(".");
  if (!v || !sig) return null;
  const expected = sign(v);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return db.select().from(schema.members).where(eq(schema.members.id, Number(v))).get() ?? null;
}

export async function requireMember() {
  const m = await currentMember();
  if (!m) redirect("/login");
  return m;
}

export async function requireAdmin() {
  const m = await requireMember();
  if (!m.isAdmin) redirect("/");
  return m;
}

export const hashPin = (pin: string) => bcrypt.hash(pin, 10);
export const checkPin = (pin: string, hash: string) => bcrypt.compare(pin, hash);
