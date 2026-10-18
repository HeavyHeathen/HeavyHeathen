import http from "node:http";

const movies = {
  1: { id: 1, title: "Arrival", release_date: "2016-11-11", poster_path: null, overview: "Aliens land.", genres: [{ id: 878, name: "Sci-Fi" }], runtime: 116, popularity: 80 },
  2: { id: 2, title: "Paddington 2", release_date: "2017-11-10", poster_path: null, overview: "A bear in prison.", genres: [{ id: 35, name: "Comedy" }], runtime: 103, popularity: 60 },
  3: { id: 3, title: "Dune", release_date: "2021-10-22", poster_path: null, overview: "Spice.", genres: [{ id: 878, name: "Sci-Fi" }], runtime: 155, popularity: 90 },
};
const list = (ids) => ({ results: ids.map((i) => ({ ...movies[i], genre_ids: movies[i].genres.map((g) => g.id) })) });

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const p = u.pathname;
  const send = (o) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
  if (p === "/genre/movie/list") return send({ genres: [{ id: 878, name: "Sci-Fi" }, { id: 35, name: "Comedy" }] });
  if (p === "/search/movie") return send(list([1, 2, 3].filter((i) => movies[i].title.toLowerCase().includes((u.searchParams.get("query") ?? "").toLowerCase()))));
  let m;
  if ((m = p.match(/^\/movie\/(\d+)\/videos$/))) return send({ results: [{ key: `yt${m[1]}`, site: "YouTube", type: "Trailer", official: true, published_at: "2020-01-01" }] });
  if ((m = p.match(/^\/movie\/(\d+)\/watch\/providers$/))) return send({ results: { US: Number(m[1]) === 1 ? { flatrate: [{ provider_id: 8, provider_name: "Netflix" }] } : {} } });
  if ((m = p.match(/^\/movie\/(\d+)\/(recommendations|similar)$/))) return send(list([1, 2, 3].filter((i) => i !== Number(m[1]))));
  if ((m = p.match(/^\/movie\/(\d+)$/))) return movies[m[1]] ? send(movies[m[1]]) : (res.statusCode = 404, res.end());
  res.statusCode = 404; res.end();
}).listen(4010, () => console.log("mock tmdb on 4010"));
