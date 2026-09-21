/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EMPLOYEES } from "./employees.js";

vi.mock("./api.js", () => ({ api: { search: vi.fn() } }));
const { api } = await import("./api.js");
const App = (await import("./App.jsx")).default;

const type = (v) => fireEvent.change(screen.getByTestId("search"), { target: { value: v } });
const rows = () => screen.getByTestId("results").children;
const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => { api.search.mockReset(); });

describe("Debounced Search", () => {
  it("makes no request and shows a prompt while the box is empty", async () => {
    render(<App />);
    await settle(350);
    expect(screen.getByTestId("idle")).toBeTruthy();
    expect(api.search).not.toHaveBeenCalled();
  });

  it("waits for a pause before searching, and searches once", async () => {
    api.search.mockResolvedValue(EMPLOYEES.slice(0, 2));
    render(<App />);
    type("a"); type("an"); type("ana");          // three keystrokes, no pause
    await settle(400);
    expect(api.search).toHaveBeenCalledTimes(1);
    expect(api.search).toHaveBeenCalledWith("ana");
  });

  it("shows the loading state while the request is in flight", async () => {
    api.search.mockReturnValue(new Promise(() => {}));
    render(<App />);
    type("priya");
    await waitFor(() => screen.getByTestId("loading"));
    expect(screen.queryByTestId("results")).toBeNull();
  });

  it("renders the results", async () => {
    api.search.mockResolvedValue([EMPLOYEES[2]]);
    render(<App />);
    type("priya");
    await waitFor(() => screen.getByTestId("results"));
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain("Priya Menon");
  });

  it("ignores a stale response that a newer search has superseded", async () => {
    // "sur" is slow and resolves LAST; "div" is fast. The screen must show "div".
    api.search.mockImplementation(
      (q) => new Promise((resolve) => setTimeout(
        () => resolve(EMPLOYEES.filter((e) => e.name.toLowerCase().includes(q))),
        q === "sur" ? 400 : 20,
      )),
    );
    render(<App />);
    type("sur");
    await settle(260);          // past the debounce, request in flight
    type("div");
    await settle(600);          // both have now resolved
    expect(rows()).toHaveLength(1);
    expect(rows()[0].textContent).toContain("Divya Nair");
  });

  it("shows no-results when the API returns an empty list", async () => {
    api.search.mockResolvedValue([]);
    render(<App />);
    type("zzzz");
    await waitFor(() => screen.getByTestId("noResults"));
    expect(screen.getByTestId("noResults").textContent.trim()).toBe("Nothing matched");
  });

  it("shows an error with a retry that recovers", async () => {
    api.search.mockRejectedValueOnce(new Error("network"))
              .mockResolvedValue([EMPLOYEES[0]]);
    render(<App />);
    type("aanya");
    await waitFor(() => screen.getByTestId("error"));
    expect(screen.getByTestId("error").textContent).toContain("Search failed.");
    fireEvent.click(screen.getByTestId("retry"));
    await waitFor(() => screen.getByTestId("results"));
    expect(rows()).toHaveLength(1);
    expect(screen.queryByTestId("error")).toBeNull();
  });

  it("treats a whitespace-only query as empty and makes no request", async () => {
    render(<App />);
    type("   ");
    await settle(400);
    expect(screen.getByTestId("idle")).toBeTruthy();
    expect(api.search).not.toHaveBeenCalled();
  });
});
