/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { sortBy } from "./sort.js";
import { PEOPLE } from "./people.js";

const names = () =>
  [...screen.getByTestId("rows").children].map((tr) => tr.children[0].textContent.trim());

describe("sortBy()", () => {
  it("does not mutate the input", () => {
    const before = PEOPLE.map((p) => p.id);
    sortBy(PEOPLE, "name", true);
    expect(PEOPLE.map((p) => p.id)).toEqual(before);
  });

  it("is stable: equal keys keep their original order", () => {
    // Priya and Arun share a salary; Priya comes first in the source data
    const out = sortBy(PEOPLE, "salary", false).filter((p) => p.salary === 2400000);
    expect(out.map((p) => p.name)).toEqual(["Priya Menon", "Arun Kumar"]);
  });

  it("sorts strings case-insensitively", () => {
    const out = sortBy([{ name: "beta" }, { name: "Alpha" }], "name", true);
    expect(out.map((r) => r.name)).toEqual(["Alpha", "beta"]);
  });

  it("sorts numbers numerically, not as text", () => {
    const out = sortBy([{ n: 9 }, { n: 10 }, { n: 100 }], "n", true);
    expect(out.map((r) => r.n)).toEqual([9, 10, 100]);
  });
});

describe("Sortable Table", () => {
  it("renders every row unsorted to begin with", () => {
    render(<App />);
    expect(names()).toEqual(PEOPLE.map((p) => p.name));
  });

  it("sorts ascending on the first click of a header", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("sort-name"));
    expect(names()[0]).toBe("Arun Kumar");
    expect(screen.getByTestId("sort-name").getAttribute("aria-sort")).toBe("ascending");
  });

  it("reverses on the second click", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("sort-name"));
    fireEvent.click(screen.getByTestId("sort-name"));
    expect(names()[0]).toBe("Rahul Verma");
    expect(screen.getByTestId("sort-name").getAttribute("aria-sort")).toBe("descending");
  });

  it("starts ascending again when you switch column", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("sort-name"));
    fireEvent.click(screen.getByTestId("sort-name"));   // now descending
    fireEvent.click(screen.getByTestId("sort-joined"));
    expect(screen.getByTestId("sort-joined").getAttribute("aria-sort")).toBe("ascending");
    expect(screen.getByTestId("sort-name").getAttribute("aria-sort")).toBe("none");
    expect(names()[0]).toBe("Arun Kumar");              // joined 2019
  });
});
