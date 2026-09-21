/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.js", () => ({
  api: { start: vi.fn(), status: vi.fn() }, POLL_MS: 30, MAX_POLLS: 8,
}));
const { api } = await import("./api.js");
const App = (await import("./App.jsx")).default;

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const run = () => fireEvent.click(screen.getByTestId("run"));

beforeEach(() => {
  api.start.mockReset(); api.status.mockReset();
  api.start.mockResolvedValue({ jobId: "j1" });
});

/** running, running, done */
const sequence = (...states) => {
  let i = 0;
  return () => Promise.resolve(states[Math.min(i++, states.length - 1)]);
};

describe("Poll Until Done", () => {
  it("is idle until you start it", async () => {
    render(<App />);
    await settle(80);
    expect(screen.getByTestId("state").textContent.trim()).toBe("idle");
    expect(api.start).not.toHaveBeenCalled();
  });

  it("polls until the job reports done, then stops", async () => {
    api.status.mockImplementation(sequence(
      { state: "running", progress: 20 },
      { state: "running", progress: 60 },
      { state: "done", progress: 100 },
    ));
    render(<App />);
    run();
    await waitFor(() => expect(screen.getByTestId("state").textContent.trim()).toBe("done"),
                  { timeout: 2000 });
    const callsAtFinish = api.status.mock.calls.length;
    await settle(200);
    expect(api.status.mock.calls.length).toBe(callsAtFinish);   // no polling after done
  });

  it("shows progress while it runs", async () => {
    api.status.mockImplementation(sequence(
      { state: "running", progress: 40 }, { state: "done", progress: 100 },
    ));
    render(<App />);
    run();
    await waitFor(() => expect(screen.getByTestId("progress").textContent).toContain("40"));
  });

  it("stops and reports when the job fails", async () => {
    api.status.mockImplementation(sequence(
      { state: "running", progress: 10 }, { state: "failed", progress: 10 },
    ));
    render(<App />);
    run();
    await waitFor(() => expect(screen.getByTestId("state").textContent.trim()).toBe("failed"),
                  { timeout: 2000 });
    const calls = api.status.mock.calls.length;
    await settle(200);
    expect(api.status.mock.calls.length).toBe(calls);
  });

  it("gives up after the maximum number of polls", async () => {
    api.status.mockResolvedValue({ state: "running", progress: 5 });
    render(<App />);
    run();
    await waitFor(() => expect(screen.getByTestId("state").textContent.trim()).toBe("timeout"),
                  { timeout: 3000 });
    expect(api.status.mock.calls.length).toBeLessThanOrEqual(8);
  });

  it("stops polling when unmounted", async () => {
    api.status.mockResolvedValue({ state: "running", progress: 5 });
    const { unmount } = render(<App />);
    run();
    await waitFor(() => expect(api.status).toHaveBeenCalled());
    unmount();
    const after = api.status.mock.calls.length;
    await settle(250);
    expect(api.status.mock.calls.length).toBe(after);
  });
});
