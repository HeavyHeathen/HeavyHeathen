import type { AvailabilityStatus } from "@/lib/availability";

export function AvailabilityBadge({ status }: { status: AvailabilityStatus }) {
  const base = "rounded-full px-2 py-0.5 text-xs";
  switch (status.kind) {
    case "streaming":
      return <span className={`${base} bg-emerald-900 text-emerald-200`}>On {status.services.join(", ")}</span>;
    case "other-streaming":
      return <span className={`${base} bg-sky-900 text-sky-200`}>Other service: {status.services.slice(0, 2).join(", ")}</span>;
    case "rent-buy":
      return <span className={`${base} bg-zinc-700 text-zinc-200`}>Rent / buy only</span>;
    default:
      return <span className={`${base} bg-rose-900 text-rose-200`}>Not streaming</span>;
  }
}
