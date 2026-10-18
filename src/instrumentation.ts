export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const cron = (await import("node-cron")).default;
  const { pollDownloads } = await import("./lib/downloads");
  cron.schedule("*/2 * * * *", () => {
    pollDownloads().catch((e) => console.error("download poll failed", e));
  });
}
