"use client";
import { useState, useTransition } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { removeFromWishlist, reorderWishlist } from "@/app/actions";
import type { Providers } from "@/db/schema";
import { ProviderLogos } from "./ProviderLogos";

export interface Row {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  providers: Providers;
  subscribed: number[];
  region: string;
}

function Item({ row, index }: { row: Row; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.tmdbId });
  const [pending, start] = useTransition();
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="card flex items-center gap-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab px-1 text-zinc-500" aria-label={`Drag ${row.title}`}>⠿</button>
      <span className={`w-6 text-center text-sm ${index < 5 ? "text-amber-400" : "text-zinc-500"}`}>{index + 1}</span>
      {row.posterPath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`https://image.tmdb.org/t/p/w92${row.posterPath}`} alt="" className="h-16 w-11 rounded object-cover" />
      ) : <div className="h-16 w-11 rounded bg-zinc-800" />}
      <div className="flex-1">
        <div className="font-medium">{row.title} {row.year && <span className="text-zinc-500">({row.year})</span>}</div>
        <div className="mt-1.5">
          <ProviderLogos providers={row.providers} subscribed={row.subscribed} region={row.region} compact />
        </div>
      </div>
      <button className="btn-ghost" disabled={pending} onClick={() => start(() => removeFromWishlist(row.tmdbId))} aria-label={`Remove ${row.title}`}>✕</button>
    </li>
  );
}

export function WishlistList({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  // keep in sync when the server sends a new list (add/remove)
  const key = initial.map((r) => r.tmdbId).join(",");
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) { setLastKey(key); setRows(initial); }

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rows.findIndex((r) => r.tmdbId === e.active.id);
    const to = rows.findIndex((r) => r.tmdbId === e.over!.id);
    const next = arrayMove(rows, from, to);
    setRows(next);
    start(() => reorderWishlist(next.map((r) => r.tmdbId)));
  }

  if (rows.length === 0) return <p className="text-zinc-400">Nothing here yet. Search above to add your first movie.</p>;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={rows.map((r) => r.tmdbId)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">{rows.map((r, i) => <Item key={r.tmdbId} row={r} index={i} />)}</ul>
      </SortableContext>
    </DndContext>
  );
}
