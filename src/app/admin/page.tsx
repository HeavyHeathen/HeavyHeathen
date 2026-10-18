import { eq } from "drizzle-orm";
import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { getSetting, region, subscribedServices } from "@/lib/data";
import type { RadarrConfig } from "@/lib/radarr";
import { addMemberAction, decideDownload, removeMemberAction, saveSettings } from "../actions";

export default async function AdminPage() {
  const me = await requireAdmin();
  const members = db.select().from(schema.members).all();
  const radarr = getSetting<RadarrConfig | null>("radarr", null);
  const requests = db
    .select({ r: schema.downloadRequests, movie: schema.movies, by: schema.members })
    .from(schema.downloadRequests)
    .innerJoin(schema.movies, eq(schema.movies.tmdbId, schema.downloadRequests.tmdbId))
    .innerJoin(schema.members, eq(schema.members.id, schema.downloadRequests.requestedBy))
    .all();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Admin</h1>

      <section className="card space-y-3">
        <h2 className="font-semibold">Family members</h2>
        <ul className="space-y-1 text-sm">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span>{m.avatar} {m.name}{m.isAdmin && " (admin)"}{m.pinHash && " 🔒"}</span>
              {m.id !== me.id && (
                <form action={removeMemberAction}><input type="hidden" name="id" value={m.id} /><button className="btn-ghost">Remove</button></form>
              )}
            </li>
          ))}
        </ul>
        <form action={addMemberAction} className="flex flex-wrap gap-2">
          <input name="name" placeholder="Name" className="input" required />
          <input name="avatar" placeholder="Emoji" className="input w-20" />
          <input name="pin" placeholder="PIN (optional)" inputMode="numeric" className="input w-32" />
          <button className="btn">Add member</button>
        </form>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Download requests</h2>
        {requests.length === 0 && <p className="text-sm text-zinc-400">None yet.</p>}
        {requests.map(({ r, movie, by }) => (
          <div key={r.id} className="flex items-center gap-3 text-sm">
            <span className="flex-1">{movie.title} · requested by {by.name} · <b>{r.status}</b>{r.error && <span className="text-rose-400"> {r.error.slice(0, 80)}</span>}</span>
            {r.status === "pending" && (
              <form action={decideDownload} className="flex gap-2">
                <input type="hidden" name="id" value={r.id} />
                <button name="decision" value="approve" className="btn">Approve</button>
                <button name="decision" value="reject" className="btn-ghost">Reject</button>
              </form>
            )}
          </div>
        ))}
      </section>

      <form action={saveSettings} className="card space-y-3 text-sm">
        <h2 className="font-semibold">Settings</h2>
        <label className="block">Region (2-letter code)
          <input name="region" defaultValue={region()} className="input ml-2 w-20" />
        </label>
        <label className="block">Subscribed streaming provider IDs (comma separated, e.g. 8 = Netflix, 9 = Prime, 337 = Disney+, 1899 = Max)
          <input name="subscribed" defaultValue={subscribedServices().join(",")} className="input mt-1 w-full" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="requireApproval" defaultChecked={getSetting<boolean>("requireApproval", true)} />
          Require admin approval for download requests
        </label>
        <h3 className="pt-2 font-medium">Radarr</h3>
        <input name="radarrUrl" placeholder="http://radarr:7878" defaultValue={radarr?.url ?? ""} className="input w-full" />
        <input name="radarrKey" placeholder="API key" defaultValue={radarr?.apiKey ?? ""} className="input w-full" />
        <div className="flex gap-2">
          <input name="radarrProfile" type="number" placeholder="Quality profile id" defaultValue={radarr?.qualityProfileId ?? 1} className="input w-40" />
          <input name="radarrRoot" placeholder="/data/movies" defaultValue={radarr?.rootFolder ?? "/data/movies"} className="input flex-1" />
        </div>
        <button className="btn">Save settings</button>
      </form>
    </div>
  );
}
