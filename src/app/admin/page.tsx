import { db, schema } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { region, subscribedServices } from "@/lib/data";
import { listProviders } from "@/lib/tmdb";
import { addMemberAction, removeMemberAction, saveSettings } from "../actions";

export default async function AdminPage() {
  const me = await requireAdmin();
  const members = db.select().from(schema.members).all();
  const currentRegion = region();
  const selected = subscribedServices();
  const providers = await listProviders(currentRegion).catch(() => []);

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

      <form action={saveSettings} className="card space-y-4 text-sm">
        <h2 className="font-semibold">Streaming</h2>
        <label className="block">Region (2-letter code, then save to refresh the list below)
          <input name="region" defaultValue={currentRegion} className="input ml-2 w-20" />
        </label>
        <div>
          <p className="mb-2">Which services does your household subscribe to?</p>
          {providers.length === 0 ? (
            <p className="text-zinc-500">Couldn&apos;t load services from TMDB. Check your API key.</p>
          ) : (
            <div className="grid max-h-80 grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-3 overflow-auto rounded-xl bg-zinc-950/60 p-3">
              {providers.map((p) => (
                <label key={p.id} className="relative cursor-pointer" title={p.name}>
                  <input type="checkbox" name="subscribed" value={p.id} defaultChecked={selected.includes(p.id)} className="peer sr-only" />
                  {p.logoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`https://image.tmdb.org/t/p/w92${p.logoPath}`} alt={p.name} className="h-14 w-14 rounded-xl opacity-40 ring-1 ring-white/10 transition peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-amber-400" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 text-center text-[10px] opacity-40 peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-amber-400">{p.name}</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">Selected services get an amber ring everywhere. Leave all unselected to treat any streaming service as yours.</p>
        </div>
        <button className="btn">Save settings</button>
      </form>
    </div>
  );
}
