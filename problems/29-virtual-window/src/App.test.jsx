/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { windowFor } from "./window.js";

const w = (o) => windowFor({ total: 1000, rowHeight: 20, viewportHeight: 100, overscan: 2, ...o });

describe("windowFor()", () => {
  it("starts at the top with overscan below only", () => {
    expect(w({ scrollTop: 0 })).toEqual({ start: 0, end: 7, offsetTop: 0, totalHeight: 20000 });
  });

  it("does not produce a negative start", () => {
    expect(w({ scrollTop: 10 }).start).toBe(0);
  });

  it("windows the middle", () => {
    // scrollTop 400 -> first visible row 20, minus 2 overscan -> 18
    expect(w({ scrollTop: 400 })).toMatchObject({ start: 18, offsetTop: 360 });
  });

  it("stops at the last row", () => {
    const r = w({ scrollTop: 20000 });
    expect(r.end).toBe(1000);
    expect(r.start).toBeLessThan(1000);
  });

  it("reports the full scrollable height", () => {
    expect(w({ scrollTop: 0 }).totalHeight).toBe(20000);
  });

  it("handles an empty list", () => {
    expect(windowFor({ total: 0, rowHeight: 20, viewportHeight: 100, scrollTop: 0 }))
      .toMatchObject({ start: 0, end: 0, totalHeight: 0 });
  });
});

describe("Virtual Window", () => {
  it("mounts only a slice of the rows", () => {
    render(<App />);
    const mounted = screen.getByTestId("rows").children.length;
    expect(mounted).toBeGreaterThan(0);
    expect(mounted).toBeLessThan(60);          // not 1000
  });

  it("moves the window as you scroll", () => {
    render(<App />);
    const first = () => screen.getByTestId("rows").children[0].textContent;
    const before = first();
    fireEvent.scroll(screen.getByTestId("viewport"), { target: { scrollTop: 4000 } });
    expect(first()).not.toBe(before);
  });
});
