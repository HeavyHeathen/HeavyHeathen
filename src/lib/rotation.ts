export interface RotationState {
  order: number[]; // member ids in turn order
  cursor: number; // index into order of the next regular turn
  owed: number[]; // members who were absent on their turn, served first
}

export function currentTurn(s: RotationState): number | null {
  if (s.owed.length > 0) return s.owed[0];
  if (s.order.length === 0) return null;
  return s.order[s.cursor % s.order.length];
}

/** The current member took their turn (movie watched). */
export function completeTurn(s: RotationState): RotationState {
  if (s.owed.length > 0) return { ...s, owed: s.owed.slice(1) };
  if (s.order.length === 0) return s;
  return { ...s, cursor: (s.cursor + 1) % s.order.length };
}

/** The current member is absent: they keep their claim and go first next time. */
export function skipTurn(s: RotationState): RotationState {
  const who = currentTurn(s);
  if (who === null) return s;
  if (s.owed.length > 0) {
    // already owed: send to the back of the owed queue
    return { ...s, owed: [...s.owed.slice(1), who] };
  }
  return {
    ...s,
    cursor: (s.cursor + 1) % s.order.length,
    owed: [...s.owed, who],
  };
}

/** Keep order in sync with the member list; new members join at the end. */
export function syncMembers(s: RotationState, memberIds: number[]): RotationState {
  const live = new Set(memberIds);
  const order = s.order.filter((id) => live.has(id));
  for (const id of memberIds) if (!order.includes(id)) order.push(id);
  const currentId = s.order[s.cursor % Math.max(s.order.length, 1)];
  const idx = order.indexOf(currentId);
  return {
    order,
    cursor: idx >= 0 ? idx : Math.min(s.cursor, Math.max(order.length - 1, 0)),
    owed: s.owed.filter((id) => live.has(id)),
  };
}

/** First wishlist item (already position-sorted) that has not been watched. */
export function defaultPick(wishlistTmdbIds: number[], watched: Set<number>): number | null {
  return wishlistTmdbIds.find((id) => !watched.has(id)) ?? null;
}
