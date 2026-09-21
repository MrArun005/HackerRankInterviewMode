/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EMPLOYEES } from "./employees.js";

// The module under test imports `api` from ./api.js; swap it per test.
vi.mock("./api.js", () => ({ api: { list: vi.fn() } }));
const { api } = await import("./api.js");
const App = (await import("./App.jsx")).default;

const rows = () => screen.getByTestId("tableBody").children;

beforeEach(() => { api.list.mockReset(); });

describe("Employee Directory", () => {
  it("shows the loading state while the request is in flight", async () => {
    api.list.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByTestId("loading")).toBeTruthy();
    expect(screen.queryByTestId("tableBody")).toBeNull();
  });

  it("renders the first 4 rows and 3 page buttons", async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    expect(rows()).toHaveLength(4);
    expect(rows()[0].textContent).toContain("Aanya Sharma");
    expect(screen.getByTestId("pageButtons").children).toHaveLength(3);
  });

  it("shows an error with a retry that recovers", async () => {
    api.list.mockRejectedValueOnce(new Error("network")).mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("error"));
    expect(screen.getByTestId("error").textContent).toContain("Couldn't load employees.");
    fireEvent.click(screen.getByTestId("retry"));
    await waitFor(() => screen.getByTestId("tableBody"));
    expect(rows()).toHaveLength(4);
    expect(screen.queryByTestId("error")).toBeNull();
  });

  it("shows the empty state when the API returns nothing", async () => {
    api.list.mockResolvedValue([]);
    render(<App />);
    await waitFor(() => screen.getByTestId("empty"));
    expect(screen.getByTestId("empty").textContent.trim()).toBe("No employees yet.");
  });

  it("shows rows 5-8 when page 2 is clicked", async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    fireEvent.click(screen.getByTestId("page-2"));
    await waitFor(() => expect(rows()[0].textContent).toContain("Meena Joshi"));
    expect(rows()).toHaveLength(4);
    expect(rows()[3].textContent).toContain("Arun Kumar");
  });

  it("filters by name or role and recalculates the buttons", async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    fireEvent.change(screen.getByTestId("search"), { target: { value: "analyst" } });
    await waitFor(() => expect(rows()).toHaveLength(3));
    expect(screen.getByTestId("pageButtons").children).toHaveLength(1);
    fireEvent.change(screen.getByTestId("search"), { target: { value: "priya" } });
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(rows()[0].textContent).toContain("Priya Menon");
  });

  it("resets to page 1 when the search changes", async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    fireEvent.click(screen.getByTestId("page-3"));
    await waitFor(() => expect(rows()).toHaveLength(3));
    fireEvent.change(screen.getByTestId("search"), { target: { value: "recruiter" } });
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[0].textContent).toContain("Divya Nair");
  });

  it("does not refetch when the search or page changes", async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    expect(api.list).toHaveBeenCalledTimes(1);
    fireEvent.change(screen.getByTestId("search"), { target: { value: "recruiter" } });
    await waitFor(() => expect(rows()).toHaveLength(2));
    fireEvent.click(screen.getByTestId("page-1"));
    expect(api.list).toHaveBeenCalledTimes(1);
  });

  it('shows "No matches" when the search excludes everything', async () => {
    api.list.mockResolvedValue(EMPLOYEES);
    render(<App />);
    await waitFor(() => screen.getByTestId("tableBody"));
    fireEvent.change(screen.getByTestId("search"), { target: { value: "zzzz" } });
    await waitFor(() => screen.getByTestId("noMatches"));
    expect(screen.getByTestId("noMatches").textContent.trim()).toBe("No matches");
    expect(screen.queryByTestId("empty")).toBeNull();
  });
});
