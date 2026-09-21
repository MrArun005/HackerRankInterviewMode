/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api.js", async () => ({ api: { remove: vi.fn() }, UNDO_MS: 300 }));
const { api } = await import("./api.js");
const App = (await import("./App.jsx")).default;

const rows   = () => screen.getByTestId("rows").children;
const del    = (id) => fireEvent.click(screen.getByTestId("delete-" + id));
const settle = (ms) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => { api.remove.mockReset(); api.remove.mockResolvedValue(); });

describe("Delete with Undo", () => {
  it("removes the row from view at once, without calling the API", async () => {
    render(<App />);
    const before = rows().length;
    del(2);
    expect(rows()).toHaveLength(before - 1);
    expect(api.remove).not.toHaveBeenCalled();
    expect(screen.getByTestId("undo")).toBeTruthy();
  });

  it("puts the row back, in its original position, on undo", async () => {
    render(<App />);
    const before = [...rows()].map((r) => r.textContent);
    del(2);
    fireEvent.click(screen.getByTestId("undo"));
    expect([...rows()].map((r) => r.textContent)).toEqual(before);
    await settle(450);
    expect(api.remove).not.toHaveBeenCalled();
  });

  it("commits to the API once the window closes", async () => {
    render(<App />);
    del(1);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1), { timeout: 1000 });
    expect(screen.queryByTestId("undo")).toBeNull();
  });

  it("restores the row if the delete is rejected", async () => {
    api.remove.mockRejectedValue(new Error("nope"));
    render(<App />);
    const before = rows().length;
    del(3);
    await waitFor(() => expect(rows()).toHaveLength(before), { timeout: 1200 });
    expect(screen.getByTestId("error").textContent).toContain("Could not delete");
  });

  it("a second delete commits the first rather than losing it", async () => {
    render(<App />);
    del(1);
    del(2);
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1), { timeout: 1000 });
    await waitFor(() => expect(api.remove).toHaveBeenCalledWith(2), { timeout: 1000 });
    expect(api.remove).toHaveBeenCalledTimes(2);
  });
});
