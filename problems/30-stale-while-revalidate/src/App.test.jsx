/* READ ONLY — the spec. Do not modify. */
import { describe, it, expect, vi } from "vitest";
import { createCache } from "./cache.js";

const tick = (ms) => new Promise((r) => setTimeout(r, ms));

const make = (fetcher, freshMs = 100) => {
  const changes = [];
  const cache = createCache({ fetcher, freshMs, onChange: () => changes.push(1) });
  return { cache, changes };
};

describe("createCache()", () => {
  it("misses on the first read and fetches", async () => {
    const fetcher = vi.fn().mockResolvedValue("v1");
    const { cache } = make(fetcher);
    expect(cache.read("a")).toBeNull();
    await tick(20);
    expect(fetcher).toHaveBeenCalledWith("a");
    expect(cache.read("a")).toEqual({ data: "v1", stale: false });
  });

  it("serves a fresh entry without refetching", async () => {
    const fetcher = vi.fn().mockResolvedValue("v1");
    const { cache } = make(fetcher);
    cache.read("a"); await tick(20);
    cache.read("a"); cache.read("a"); await tick(20);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves stale data immediately and refreshes behind it", async () => {
    let n = 0;
    const fetcher = vi.fn(async () => "v" + ++n);
    const { cache } = make(fetcher, 60);
    cache.read("a"); await tick(20);
    await tick(80);                                  // now stale
    expect(cache.read("a")).toEqual({ data: "v1", stale: true });   // served at once
    await tick(40);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(cache.read("a")).toEqual({ data: "v2", stale: false });
  });

  it("collapses concurrent reads of the same key into one fetch", async () => {
    const fetcher = vi.fn(() => new Promise((r) => setTimeout(() => r("v"), 40)));
    const { cache } = make(fetcher);
    cache.read("a"); cache.read("a"); cache.read("a");
    await tick(80);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps keys apart", async () => {
    const fetcher = vi.fn(async (k) => k.toUpperCase());
    const { cache } = make(fetcher);
    cache.read("a"); cache.read("b");
    await tick(30);
    expect(cache.read("a").data).toBe("A");
    expect(cache.read("b").data).toBe("B");
  });

  it("keeps serving the old value when a refresh fails", async () => {
    let n = 0;
    const fetcher = vi.fn(async () => { if (++n === 1) return "v1"; throw new Error("down"); });
    const { cache } = make(fetcher, 40);
    cache.read("a"); await tick(20);
    await tick(60);
    cache.read("a");                                  // triggers a failing refresh
    await tick(60);
    expect(cache.read("a").data).toBe("v1");
  });

  it("tells the caller when something changed", async () => {
    const fetcher = vi.fn().mockResolvedValue("v1");
    const { cache, changes } = make(fetcher);
    cache.read("a"); await tick(30);
    expect(changes.length).toBeGreaterThan(0);
  });
});
