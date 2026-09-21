/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const node   = (id) => screen.queryByTestId("node-" + id);
const toggle = (id) => fireEvent.click(screen.getByTestId("toggle-" + id));

describe("Expandable Tree", () => {
  it("shows only the roots, collapsed", () => {
    render(<App />);
    expect(node("eng")).toBeTruthy();
    expect(node("ppl")).toBeTruthy();
    expect(node("fe")).toBeNull();
    expect(screen.getByTestId("toggle-eng").getAttribute("aria-expanded")).toBe("false");
  });

  it("expands one level at a time", () => {
    render(<App />);
    toggle("eng");
    expect(node("fe")).toBeTruthy();
    expect(node("fe1")).toBeNull();          // grandchildren stay closed
    toggle("fe");
    expect(node("fe1")).toBeTruthy();
  });

  it("collapses again", () => {
    render(<App />);
    toggle("eng"); toggle("eng");
    expect(node("fe")).toBeNull();
  });

  it("remembers a child's state while the parent is closed and reopened", () => {
    render(<App />);
    toggle("eng"); toggle("fe");
    expect(node("fe1")).toBeTruthy();
    toggle("eng");                            // close the parent
    toggle("eng");                            // and open it again
    expect(node("fe1")).toBeTruthy();
  });

  it("leaves have no toggle", () => {
    render(<App />);
    toggle("eng"); toggle("fe");
    expect(screen.queryByTestId("toggle-fe1")).toBeNull();
  });

  it("marks depth for assistive tech", () => {
    render(<App />);
    toggle("eng");
    expect(node("eng").getAttribute("aria-level")).toBe("1");
    expect(node("fe").getAttribute("aria-level")).toBe("2");
  });
});
