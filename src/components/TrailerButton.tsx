"use client";
import { useState, useTransition } from "react";
import { trailerPlaylist } from "@/app/actions";

export function TrailerButton() {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3">
      <button
        className="btn"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await trailerPlaylist();
            if ("error" in r) return setMsg(r.error);
            window.open(r.url, "_blank", "noopener");
            setMsg(`Opened a playlist of ${r.count} trailers.`);
          })
        }
      >
        ▶ Top 5 trailers
      </button>
      {msg && <span className="text-sm text-zinc-400">{msg}</span>}
    </div>
  );
}
