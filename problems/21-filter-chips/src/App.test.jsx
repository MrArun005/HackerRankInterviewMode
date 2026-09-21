/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { applyFilters } from "./applyFilters.js";
import { PEOPLE } from "./data.js";

const names = () => [...screen.getByTestId("rows").children].map((li) => li.textContent.trim());
const chip  = (kind, v) => screen.getByTestId("chip-" + kind + "-" + v);

describe("applyFilters()", () => {
  const base = { depts: [], sites: [], contractOnly: false };

  it("returns everyone when nothing is chosen", () => {
    expect(applyFilters(PEOPLE, base)).toHaveLength(6);
  });

  it("ORs the choices inside one facet", () => {
    const out = applyFilters(PEOPLE, { ...base, depts: ["Engineering", "Finance"] });
    expect(out.map((p) => p.id)).toEqual([1, 2, 5, 6]);
  });

  it("ANDs across facets", () => {
    const out = applyFilters(PEOPLE, { ...base, depts: ["Engineering"], sites: ["Chennai"] });
    expect(out.map((p) => p.id)).toEqual([2]);
  });

  it("applies the contract toggle on top", () => {
    const out = applyFilters(PEOPLE, { ...base, contractOnly: true });
    expect(out.map((p) => p.id)).toEqual([2, 4]);
  });

  it("can produce nothing", () => {
    expect(applyFilters(PEOPLE, { ...base, depts: ["Finance"], sites: ["Remote"] })).toEqual([]);
  });
});

describe("Filter Chips", () => {
  it("lists everyone to begin with", () => {
    render(<App />);
    expect(names()).toHaveLength(6);
  });

  it("toggles a chip on and off", () => {
    render(<App />);
    fireEvent.click(chip("dept", "People"));
    expect(names()).toHaveLength(2);
    expect(chip("dept", "People").getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(chip("dept", "People"));
    expect(names()).toHaveLength(6);
  });

  it("shows a count and an empty state", () => {
    render(<App />);
    fireEvent.click(chip("dept", "Finance"));
    fireEvent.click(chip("site", "Remote"));
    expect(screen.getByTestId("empty").textContent.trim()).toBe("No one matches");
    expect(screen.getByTestId("count").textContent.trim()).toBe("0 of 6");
  });

  it("clears every facet at once", () => {
    render(<App />);
    fireEvent.click(chip("dept", "People"));
    fireEvent.click(chip("site", "Remote"));
    fireEvent.click(screen.getByTestId("clear"));
    expect(names()).toHaveLength(6);
    expect(chip("dept", "People").getAttribute("aria-pressed")).toBe("false");
  });
});
