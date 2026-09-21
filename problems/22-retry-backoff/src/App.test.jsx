/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.js", () => ({
  api: { fetchReport: vi.fn() }, BASE_MS: 40, MAX_TRIES: 4,
}));
const { api, BASE_MS } = await import("./api.js");
const { withRetry } = await import("./withRetry.js");
const App = (await import("./App.jsx")).default;

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => { api.fetchReport.mockReset(); });

describe("withRetry()", () => {
  it("returns the first success without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries a failure and returns the eventual success", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("a"))
      .mockRejectedValueOnce(new Error("b"))
      .mockResolvedValue("ok");
    await expect(withRetry(fn)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("gives up after the maximum and throws the last error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always"));
    await expect(withRetry(fn)).rejects.toThrow("always");
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("backs off exponentially", async () => {
    const waits = [];
    const fn = vi.fn().mockRejectedValue(new Error("x"));
    const started = [];
    await withRetry(fn, { onAttempt: () => started.push(Date.now()) }).catch(() => {});
    for (let i = 1; i < started.length; i++) waits.push(started[i] - started[i - 1]);
    // 40, 80, 160 — allow for timer slack, but the shape must double
    expect(waits).toHaveLength(3);
    expect(waits[0]).toBeGreaterThanOrEqual(BASE_MS - 10);
    expect(waits[1]).toBeGreaterThan(waits[0]);
    expect(waits[2]).toBeGreaterThan(waits[1]);
  });

  it("reports each attempt number", async () => {
    const seen = [];
    const fn = vi.fn().mockRejectedValue(new Error("x"));
    await withRetry(fn, { onAttempt: (n) => seen.push(n) }).catch(() => {});
    expect(seen).toEqual([1, 2, 3, 4]);
  });
});

describe("Report screen", () => {
  it("shows the attempt while retrying, then the result", async () => {
    api.fetchReport.mockRejectedValueOnce(new Error("x")).mockResolvedValue({ rows: 3 });
    render(<App />);
    fireEvent.click(screen.getByTestId("load"));
    await waitFor(() => expect(screen.getByTestId("attempt").textContent).toContain("2"),
                  { timeout: 1500 });
    await waitFor(() => expect(screen.getByTestId("rows").textContent).toContain("3"),
                  { timeout: 1500 });
  });

  it("gives up and shows an error", async () => {
    api.fetchReport.mockRejectedValue(new Error("down"));
    render(<App />);
    fireEvent.click(screen.getByTestId("load"));
    await waitFor(() => expect(screen.getByTestId("error").textContent)
                    .toContain("Gave up after 4 attempts"), { timeout: 3000 });
  });
});
