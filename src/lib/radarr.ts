export interface RadarrConfig {
  url: string;
  apiKey: string;
  qualityProfileId: number;
  rootFolder: string;
}

async function call<T>(cfg: RadarrConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${cfg.url.replace(/\/$/, "")}/api/v3${path}`, {
    ...init,
    headers: { "X-Api-Key": cfg.apiKey, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Radarr ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const listQualityProfiles = (c: RadarrConfig) =>
  call<{ id: number; name: string }[]>(c, "/qualityprofile");
export const listRootFolders = (c: RadarrConfig) =>
  call<{ id: number; path: string }[]>(c, "/rootfolder");

/** Add a movie by TMDB id and start searching. Returns the Radarr movie id. */
export async function addMovie(cfg: RadarrConfig, tmdbId: number): Promise<number> {
  const existing = await call<{ id: number }[]>(cfg, `/movie?tmdbId=${tmdbId}`);
  if (existing.length > 0) return existing[0].id;
  const lookup = await call<Record<string, unknown>>(cfg, `/movie/lookup/tmdb?tmdbId=${tmdbId}`);
  const added = await call<{ id: number }>(cfg, "/movie", {
    method: "POST",
    body: JSON.stringify({
      ...lookup,
      qualityProfileId: cfg.qualityProfileId,
      rootFolderPath: cfg.rootFolder,
      monitored: true,
      addOptions: { searchForMovie: true },
    }),
  });
  return added.id;
}

export type RadarrStatus = "downloading" | "available" | "sent";

export async function movieStatus(cfg: RadarrConfig, radarrId: number): Promise<RadarrStatus> {
  const m = await call<{ hasFile: boolean }>(cfg, `/movie/${radarrId}`);
  if (m.hasFile) return "available";
  const q = await call<{ records: { movieId: number }[] }>(cfg, "/queue?pageSize=200");
  return q.records.some((r) => r.movieId === radarrId) ? "downloading" : "sent";
}
