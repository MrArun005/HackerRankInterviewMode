/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const all  = () => screen.getByTestId("select-all");
const row  = (n) => screen.getByTestId("row-" + n);
const count = () => screen.getByTestId("count").textContent.trim();

describe("Select All", () => {
  it("starts with nothing selected", () => {
    render(<App />);
    expect(all().checked).toBe(false);
    expect(all().indeterminate).toBe(false);
    expect(count()).toBe("0 selected");
  });

  it("selects everything from the header box", () => {
    render(<App />);
    fireEvent.click(all());
    for (let n = 1; n <= 4; n++) expect(row(n).checked).toBe(true);
    expect(count()).toBe("4 selected");
  });

  it("goes indeterminate on a partial selection", () => {
    render(<App />);
    fireEvent.click(row(2));
    expect(all().checked).toBe(false);
    expect(all().indeterminate).toBe(true);
    expect(count()).toBe("1 selected");
  });

  it("becomes fully checked when the last row is ticked", () => {
    render(<App />);
    for (let n = 1; n <= 4; n++) fireEvent.click(row(n));
    expect(all().checked).toBe(true);
    expect(all().indeterminate).toBe(false);
  });

  it("clears everything when unticked from full", () => {
    render(<App />);
    fireEvent.click(all());
    fireEvent.click(all());
    expect(count()).toBe("0 selected");
    for (let n = 1; n <= 4; n++) expect(row(n).checked).toBe(false);
  });

  it("selects all from a partial state rather than clearing", () => {
    render(<App />);
    fireEvent.click(row(1));
    fireEvent.click(all());
    expect(count()).toBe("4 selected");
  });
});
