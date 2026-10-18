/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  images: { remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }] },
};
export default nextConfig;
