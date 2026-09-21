/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const tab   = (n) => screen.getByTestId("tab-" + n);
const panel = () => screen.getByTestId("panel");
const key   = (el, k) => fireEvent.keyDown(el, { key: k });

describe("Tabs with Keyboard", () => {
  it("shows the first tab selected", () => {
    render(<App />);
    expect(tab(1).getAttribute("aria-selected")).toBe("true");
    expect(tab(2).getAttribute("aria-selected")).toBe("false");
    expect(panel().textContent).toContain("Overview");
  });

  it("switches on click", () => {
    render(<App />);
    fireEvent.click(tab(3));
    expect(tab(3).getAttribute("aria-selected")).toBe("true");
    expect(panel().textContent).toContain("Billing");
  });

  it("moves with the arrow keys", () => {
    render(<App />);
    key(tab(1), "ArrowRight");
    expect(tab(2).getAttribute("aria-selected")).toBe("true");
    key(tab(2), "ArrowLeft");
    expect(tab(1).getAttribute("aria-selected")).toBe("true");
  });

  it("wraps at both ends", () => {
    render(<App />);
    key(tab(1), "ArrowLeft");
    expect(tab(3).getAttribute("aria-selected")).toBe("true");
    key(tab(3), "ArrowRight");
    expect(tab(1).getAttribute("aria-selected")).toBe("true");
  });

  it("jumps to the ends with Home and End", () => {
    render(<App />);
    key(tab(1), "End");
    expect(tab(3).getAttribute("aria-selected")).toBe("true");
    key(tab(3), "Home");
    expect(tab(1).getAttribute("aria-selected")).toBe("true");
  });

  it("keeps only the selected tab in the tab order", () => {
    render(<App />);
    expect(tab(1).tabIndex).toBe(0);
    expect(tab(2).tabIndex).toBe(-1);
    fireEvent.click(tab(2));
    expect(tab(1).tabIndex).toBe(-1);
    expect(tab(2).tabIndex).toBe(0);
  });
});
