import { describe, it, expect } from "vitest";
import { classify, shouldOfferDownload } from "@/lib/availability";

const p = (flat: [number, string][], rent = false) => ({
  flatrate: flat.map(([id, name]) => ({ id, name })),
  rent: rent ? [{ id: 9, name: "Apple" }] : [],
  buy: [],
});

describe("availability", () => {
  it("streaming on a subscribed service", () => {
    const s = classify(p([[8, "Netflix"]]), [8]);
    expect(s).toEqual({ kind: "streaming", services: ["Netflix"] });
    expect(shouldOfferDownload(s)).toBe(false);
  });
  it("only on a service we don't have offers download", () => {
    const s = classify(p([[337, "Disney+"]]), [8]);
    expect(s.kind).toBe("other-streaming");
    expect(shouldOfferDownload(s)).toBe(true);
  });
  it("no subscriptions configured counts any flatrate", () => {
    expect(classify(p([[8, "Netflix"]]), []).kind).toBe("streaming");
  });
  it("rent/buy and none", () => {
    expect(classify(p([], true), [8]).kind).toBe("rent-buy");
    expect(classify(p([]), [8]).kind).toBe("none");
  });
});
