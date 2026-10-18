import { describe, it, expect } from "vitest";
import { currentTurn, completeTurn, skipTurn, syncMembers, defaultPick } from "@/lib/rotation";

const base = { order: [1, 2, 3], cursor: 0, owed: [] as number[] };

describe("rotation", () => {
  it("cycles through members", () => {
    let s = base;
    const seen: (number | null)[] = [];
    for (let i = 0; i < 4; i++) {
      seen.push(currentTurn(s));
      s = completeTurn(s);
    }
    expect(seen).toEqual([1, 2, 3, 1]);
  });

  it("skipped member is served first next time and does not lose their turn", () => {
    let s = skipTurn(base); // 1 absent
    expect(currentTurn(s)).toBe(1); // owed first
    s = completeTurn(s);
    expect(s.owed).toEqual([]);
    expect(currentTurn(s)).toBe(2);
  });

  it("handles empty rotation", () => {
    const s = { order: [], cursor: 0, owed: [] };
    expect(currentTurn(s)).toBeNull();
    expect(completeTurn(s)).toEqual(s);
    expect(skipTurn(s)).toEqual(s);
  });

  it("syncMembers adds, removes, and keeps the current member's turn", () => {
    const s = syncMembers({ order: [1, 2, 3], cursor: 2, owed: [1] }, [2, 3, 4]);
    expect(s.order).toEqual([2, 3, 4]);
    expect(currentTurn({ ...s, owed: [] })).toBe(3);
    expect(s.owed).toEqual([]);
  });

  it("defaultPick skips watched", () => {
    expect(defaultPick([10, 11, 12], new Set([10]))).toBe(11);
    expect(defaultPick([10], new Set([10]))).toBeNull();
  });
});
