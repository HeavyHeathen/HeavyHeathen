import { describe, it, expect } from "vitest";
import { classify, hasLogos, sortProviders } from "@/lib/availability";
import type { Providers } from "@/db/schema";

const p = (flat: [number, string][], rent = false): Providers => ({
  flatrate: flat.map(([id, name]) => ({ id, name, logoPath: `/${id}.jpg` })),
  rent: rent ? [{ id: 9, name: "Apple", logoPath: "/9.jpg" }] : [],
  buy: [],
});

describe("availability", () => {
  it("streaming on a subscribed service", () => {
    expect(classify(p([[8, "Netflix"]]), [8])).toEqual({ kind: "streaming", services: ["Netflix"] });
  });
  it("only on a service we don't have", () => {
    expect(classify(p([[337, "Disney+"]]), [8]).kind).toBe("other-streaming");
  });
  it("no subscriptions configured counts any flatrate", () => {
    expect(classify(p([[8, "Netflix"]]), []).kind).toBe("streaming");
  });
  it("rent/buy and none", () => {
    expect(classify(p([], true), [8]).kind).toBe("rent-buy");
    expect(classify(p([]), [8]).kind).toBe("none");
  });
  it("detects cache rows saved before logos were stored", () => {
    expect(hasLogos(p([[8, "Netflix"]]))).toBe(true);
    const old = { flatrate: [{ id: 8, name: "Netflix" }], rent: [], buy: [] } as unknown as Providers;
    expect(hasLogos(old)).toBe(false);
    expect(hasLogos(p([]))).toBe(true);
  });
  it("sorts subscribed services first, keeping the rest in order", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(sortProviders(list, [3, 4]).map((x) => x.id)).toEqual([3, 4, 1, 2]);
    expect(sortProviders(list, []).map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });
});
