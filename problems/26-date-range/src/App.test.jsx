/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { checkRange } from "./range.js";

describe("checkRange()", () => {
  it("counts both ends", () => {
    expect(checkRange("2026-03-02", "2026-03-04")).toEqual({ days: 3 });
  });
  it("allows a single day", () => {
    expect(checkRange("2026-03-02", "2026-03-02")).toEqual({ days: 1 });
  });
  it("rejects a backwards range", () => {
    expect(checkRange("2026-03-05", "2026-03-02"))
      .toEqual({ error: "End date cannot be before the start date" });
  });
  it("counts across a month boundary", () => {
    expect(checkRange("2026-01-30", "2026-02-02")).toEqual({ days: 4 });
  });
  it("counts across a leap day", () => {
    expect(checkRange("2028-02-28", "2028-03-01")).toEqual({ days: 3 });
  });
  it("allows exactly the maximum", () => {
    expect(checkRange("2026-03-01", "2026-03-30")).toEqual({ days: 30 });
  });
  it("rejects one day over", () => {
    expect(checkRange("2026-03-01", "2026-03-31"))
      .toEqual({ error: "Range cannot exceed 30 days" });
  });
  it("needs both dates", () => {
    expect(checkRange("", "2026-03-02")).toEqual({ error: "Pick both dates" });
  });
});

describe("Date Range", () => {
  it("shows the day count for a good range", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("start"), { target: { value: "2026-03-02" } });
    fireEvent.change(screen.getByTestId("end"),   { target: { value: "2026-03-06" } });
    expect(screen.getByTestId("days").textContent.trim()).toBe("5 days");
  });

  it("uses the singular for one day", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("start"), { target: { value: "2026-03-02" } });
    fireEvent.change(screen.getByTestId("end"),   { target: { value: "2026-03-02" } });
    expect(screen.getByTestId("days").textContent.trim()).toBe("1 day");
  });

  it("shows the error instead of a count", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("start"), { target: { value: "2026-03-05" } });
    fireEvent.change(screen.getByTestId("end"),   { target: { value: "2026-03-02" } });
    expect(screen.getByTestId("error")).toBeTruthy();
    expect(screen.queryByTestId("days")).toBeNull();
  });
});
