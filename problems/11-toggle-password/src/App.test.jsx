/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const input  = () => screen.getByTestId("password");
const toggle = () => screen.getByTestId("toggle");

describe("Password Field", () => {
  it("starts hidden", () => {
    render(<App />);
    expect(input().type).toBe("password");
    expect(toggle().getAttribute("aria-pressed")).toBe("false");
    expect(toggle().textContent.trim()).toBe("Show");
  });

  it("reveals and hides again", () => {
    render(<App />);
    fireEvent.click(toggle());
    expect(input().type).toBe("text");
    expect(toggle().textContent.trim()).toBe("Hide");
    fireEvent.click(toggle());
    expect(input().type).toBe("password");
  });

  it("keeps what you typed when toggling", () => {
    render(<App />);
    fireEvent.change(input(), { target: { value: "hunter2" } });
    fireEvent.click(toggle());
    expect(input().value).toBe("hunter2");
  });

  it("labels the toggle for screen readers", () => {
    render(<App />);
    expect(toggle().getAttribute("aria-label")).toBe("Show password");
    fireEvent.click(toggle());
    expect(toggle().getAttribute("aria-label")).toBe("Hide password");
  });

  it("reports strength from the length", () => {
    render(<App />);
    fireEvent.change(input(), { target: { value: "abc" } });
    expect(screen.getByTestId("strength").textContent.trim()).toBe("Weak");
    fireEvent.change(input(), { target: { value: "abcdefgh" } });
    expect(screen.getByTestId("strength").textContent.trim()).toBe("Fair");
    fireEvent.change(input(), { target: { value: "abcdefghijkl" } });
    expect(screen.getByTestId("strength").textContent.trim()).toBe("Strong");
  });

  it("says nothing about strength when empty", () => {
    render(<App />);
    expect(screen.queryByTestId("strength")).toBeNull();
  });
});
