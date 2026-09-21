/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const box    = () => screen.getByTestId("note");
const count  = () => screen.getByTestId("count").textContent.trim();
const type   = (v) => fireEvent.change(box(), { target: { value: v } });

describe("Character Counter", () => {
  it("starts at the full allowance", () => {
    render(<App />);
    expect(count()).toBe("200 characters left");
  });

  it("counts down as you type", () => {
    render(<App />);
    type("hello");
    expect(count()).toBe("195 characters left");
  });

  it("uses the singular at one", () => {
    render(<App />);
    type("x".repeat(199));
    expect(count()).toBe("1 character left");
  });

  it("warns when few remain", () => {
    render(<App />);
    type("x".repeat(180));
    expect(screen.getByTestId("count").getAttribute("data-state")).toBe("warn");
    type("x".repeat(100));
    expect(screen.getByTestId("count").getAttribute("data-state")).toBe("ok");
  });

  it("refuses to exceed the limit", () => {
    render(<App />);
    type("x".repeat(250));
    expect(box().value).toHaveLength(200);
    expect(count()).toBe("0 characters left");
  });

  it("disables submit when empty and enables it with content", () => {
    render(<App />);
    expect(screen.getByTestId("submit").disabled).toBe(true);
    type("a note");
    expect(screen.getByTestId("submit").disabled).toBe(false);
    type("   ");
    expect(screen.getByTestId("submit").disabled).toBe(true);
  });
});
