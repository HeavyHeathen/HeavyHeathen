# 🍿 Movie Night

A shared family movie planner.

- Each person keeps an **ordered wishlist** (drag to reorder).
- Shows **which streaming services** carry each movie, as service logos (Netflix, Prime Video, Hulu, Disney+ and more) right in search results. Rent and buy options are listed too. Data is by JustWatch via TMDB.
- **Round-robin picker**: everyone gets a night. Absent? Skip them and they keep their turn.
- **Top 5 trailers** from a wishlist opened as a YouTube playlist.
- **Watch history** with ratings and who picked what.
- **Suggestions** based on what you've watched and what's on your wishlist.

## Quick start

1. Get a free API key at <https://www.themoviedb.org/settings/api>.
2. `cp .env.example .env` and fill in `TMDB_API_KEY` and a random `SESSION_SECRET`.
3. Run:
   ```sh
   docker compose up -d --build
   ```
4. Open <http://localhost:3000>, create the admin profile, then add family members under **Admin**.

Sign-in is a profile picker with an optional PIN. That is fine for a trusted household on your LAN or a VPN such as Tailscale, but do not expose it to the open internet.

## Streaming services

Under **Admin**, **Streaming**, set your region and tick the logos of the services your household pays for. Those get an amber ring everywhere in the app. Leave them all unticked to treat any streaming service as yours.

Streaming availability comes from [JustWatch](https://www.justwatch.com) through TMDB. Their terms require attribution, so the app shows "Streaming data by JustWatch" next to the logos. Logo images are served by TMDB.

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
