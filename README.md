# 🍿 Movie Night

A shared family movie planner.

- Each person keeps an **ordered wishlist** (drag to reorder).
- Shows **which streaming services** carry each movie (via TMDB / JustWatch data).
- Movies not on your services get a **Request download** button, which goes to Radarr (with optional admin approval).
- **Round-robin picker**: everyone gets a night. Absent? Skip them and they keep their turn.
- **Top 5 trailers** from a wishlist opened as a YouTube playlist.
- **Watch history** with ratings and who picked what.
- **Suggestions** based on what you've watched and what's on your wishlist.

## Quick start

1. Get a free API key at <https://www.themoviedb.org/settings/api>.
2. `cp .env.example .env` and fill in `TMDB_API_KEY` and a random `SESSION_SECRET`.
3. Run:
   ```sh
   docker compose up -d --build                  # just the app
   docker compose --profile arr up -d --build    # app + Radarr + Prowlarr + qBittorrent
   ```
4. Open <http://localhost:3000>, create the admin profile, then add family members under **Admin**.

Sign-in is a profile picker with an optional PIN. That is fine for a trusted household on your LAN or a VPN such as Tailscale, but do not expose it to the open internet.

## Setting up downloads (one time)

Only needed if you want the download button. Movies only, so Radarr is enough (no Sonarr).

1. Open qBittorrent (`:8080`), set a password, keep downloads under `/data/downloads`.
2. Open Prowlarr (`:9696`) and add your indexers.
3. Open Radarr (`:7878`): Settings, Media Management, add root folder `/data/movies`. Settings, Download Clients, add qBittorrent (host `qbittorrent`). Settings, Indexers, add Prowlarr (or let Prowlarr push to Radarr via its app sync).
4. Copy Radarr's API key (Settings, General).
5. In Movie Night, **Admin**, **Settings**: URL `http://radarr:7878`, the API key, your quality profile id, and root folder `/data/movies`.

You are responsible for using indexers and content you are legally entitled to. A VPN in front of qBittorrent is strongly recommended.

## Streaming services

Under **Admin**, **Settings**, set your region and the TMDB provider IDs you subscribe to (8 = Netflix, 9 = Prime Video, 337 = Disney+, 1899 = Max). Leave empty to treat any streaming service as "available".

## YouTube trailer playlist

The button opens a `watch_videos` link containing your top 5 trailers, which YouTube plays as a temporary playlist. No Google account or API setup needed. Saving it as a permanent playlist (YouTube API OAuth) is not built yet.

## Development

```sh
npm install
cp .env.example .env
npm run dev
npm run typecheck && npm run lint && npm test   # unit tests
CHROMIUM_PATH=/path/to/chrome npm run e2e        # end-to-end smoke test against a mock TMDB
```

Stack: Next.js 15, TypeScript, SQLite (better-sqlite3 + Drizzle), Tailwind. Data lives in `DATABASE_PATH` (a Docker volume by default).
