/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { highlight } from "./highlight.js";

describe("highlight()", () => {
  it("returns one plain part when there is no query", () => {
    expect(highlight("Priya Menon", "")).toEqual([{ text: "Priya Menon", match: false }]);
  });

  it("splits around a match", () => {
    expect(highlight("Priya Menon", "ya")).toEqual([
      { text: "Pri", match: false }, { text: "ya", match: true }, { text: " Menon", match: false },
    ]);
  });

  it("matches case-insensitively but keeps the original text", () => {
    expect(highlight("Priya", "PRI")).toEqual([
      { text: "Pri", match: true }, { text: "ya", match: false },
    ]);
  });

  it("marks every occurrence", () => {
    expect(highlight("aXaXa", "a").filter((p) => p.match)).toHaveLength(3);
  });

  it("treats regex characters as literal text", () => {
    expect(() => highlight("net (profit)", "(")).not.toThrow();
    expect(highlight("net (profit)", "(").some((p) => p.match)).toBe(true);
  });

  it("returns the whole string when nothing matches", () => {
    expect(highlight("Priya", "zz")).toEqual([{ text: "Priya", match: false }]);
  });
});

describe("Search Highlight", () => {
  it("marks matches in the list", () => {
    render(<App />);
    fireEvent.change(screen.getByTestId("q"), { target: { value: "ya" } });
    expect(screen.getAllByTestId("mark").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("mark")[0].textContent).toBe("ya");
  });

  it("does not fall over on a lone bracket", () => {
    render(<App />);
    expect(() =>
      fireEvent.change(screen.getByTestId("q"), { target: { value: "(" } })).not.toThrow();
  });
});
