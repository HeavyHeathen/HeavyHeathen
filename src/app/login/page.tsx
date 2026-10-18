import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { login, setupFirstAdmin } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ member?: string; error?: string }> }) {
  const sp = await searchParams;
  const count = db.select({ n: sql<number>`count(*)` }).from(schema.members).get()!.n;

  if (count === 0) {
    return (
      <form action={setupFirstAdmin} className="card mx-auto max-w-sm space-y-3">
        <h1 className="text-xl font-semibold">Welcome! Create the admin profile</h1>
        <input name="name" placeholder="Your name" className="input w-full" required />
        <input name="pin" placeholder="PIN (optional)" inputMode="numeric" className="input w-full" />
        <button className="btn w-full">Create</button>
      </form>
    );
  }

  const members = db.select().from(schema.members).all();
  const picked = sp.member ? members.find((m) => m.id === Number(sp.member)) : undefined;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Who&apos;s watching?</h1>
      {sp.error === "pin" && <p className="mb-3 text-rose-400">Wrong PIN, try again.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {members.map((m) => (
          <form key={m.id} action={login} className="card text-center">
            <input type="hidden" name="memberId" value={m.id} />
            <div className="text-4xl">{m.avatar}</div>
            <div className="my-2 font-medium">{m.name}</div>
            {m.pinHash && (
              <input name="pin" type="password" inputMode="numeric" placeholder="PIN" className="input mb-2 w-full" autoFocus={picked?.id === m.id} />
            )}
            <button className="btn w-full">Enter</button>
          </form>
        ))}
      </div>
    </div>
  );
}
