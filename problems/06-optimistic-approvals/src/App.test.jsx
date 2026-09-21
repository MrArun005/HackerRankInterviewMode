/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { REQUESTS } from "./requests.js";

vi.mock("./api.js", () => ({ api: { list: vi.fn(), approve: vi.fn() } }));
const { api } = await import("./api.js");
const App = (await import("./App.jsx")).default;

const status = (id) => screen.getByTestId("status-" + id).textContent.trim();
const approve = (id) => fireEvent.click(screen.getByTestId("approve-" + id));
const settle = (ms = 250) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  api.list.mockReset(); api.approve.mockReset();
  api.list.mockResolvedValue(REQUESTS);
});

describe("Optimistic Approvals", () => {
  it("lists the pending requests", async () => {
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    expect(screen.getByTestId("rows").children).toHaveLength(3);
    expect(status(1)).toBe("pending");
  });

  it("flips to approved immediately, before the API answers", async () => {
    let settleIt;
    api.approve.mockReturnValue(new Promise((res) => { settleIt = res; }));
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    approve(2);
    // no await for the request: the UI must not wait for the round trip
    await waitFor(() => expect(status(2)).toBe("approved"));
    expect(api.approve).toHaveBeenCalledWith(2);
    settleIt();
  });

  it("disables the button while that row is in flight", async () => {
    api.approve.mockReturnValue(new Promise(() => {}));
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    approve(1);
    await waitFor(() =>
      expect(screen.getByTestId("approve-1").disabled).toBe(true));
    // a different row stays usable
    expect(screen.getByTestId("approve-3").disabled).toBe(false);
  });

  it("rolls back and explains itself when the API rejects", async () => {
    api.approve.mockRejectedValue(new Error("nope"));
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    approve(3);
    await waitFor(() => expect(status(3)).toBe("approved"));   // optimistic
    await waitFor(() => expect(status(3)).toBe("pending"));    // rolled back
    expect(screen.getByTestId("error-3").textContent).toContain("Could not approve");
    expect(screen.getByTestId("approve-3").disabled).toBe(false);
  });

  it("keeps concurrent approvals independent", async () => {
    // row 1 fails slowly, row 2 succeeds quickly
    api.approve.mockImplementation((id) =>
      id === 1 ? new Promise((_, rej) => setTimeout(() => rej(new Error("x")), 120))
               : new Promise((res) => setTimeout(res, 20)));
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    approve(1); approve(2);
    await settle(300);
    expect(status(1)).toBe("pending");    // rolled back
    expect(status(2)).toBe("approved");   // untouched by the other failure
    expect(screen.queryByTestId("error-2")).toBeNull();
  });

  it("clears a row's error when it is retried successfully", async () => {
    api.approve.mockRejectedValueOnce(new Error("nope")).mockResolvedValue();
    render(<App />);
    await waitFor(() => screen.getByTestId("rows"));
    approve(1);
    await waitFor(() => screen.getByTestId("error-1"));
    approve(1);
    await waitFor(() => expect(screen.queryByTestId("error-1")).toBeNull());
    expect(status(1)).toBe("approved");
  });
});
