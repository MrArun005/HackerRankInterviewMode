/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const count = () => screen.getByTestId("count").textContent.trim();
const setStep = (v) => fireEvent.change(screen.getByTestId("step"), { target: { value: v } });
const click = (id, n = 1) => { for (let i = 0; i < n; i++) fireEvent.click(screen.getByTestId(id)); };

describe("Counter with Step", () => {
  it("starts at 0", () => { render(<App />); expect(count()).toBe("0"); });

  it("increments and decrements by 1 by default", () => {
    render(<App />);
    click("inc", 3); expect(count()).toBe("3");
    click("dec");    expect(count()).toBe("2");
  });

  it("uses the selected step", () => {
    render(<App />);
    setStep("5");
    click("inc", 2); expect(count()).toBe("10");
    click("dec");    expect(count()).toBe("5");
  });

  it("allows exactly the maximum", () => {
    render(<App />);
    setStep("10");
    click("inc", 10);           // 100 exactly
    expect(count()).toBe("100");
  });

  it("does not go past the maximum, even on an overshooting step", () => {
    render(<App />);
    setStep("10");
    click("inc", 12);           // would be 120
    expect(count()).toBe("100");
  });

  it("does not go below zero", () => {
    render(<App />);
    setStep("5");
    click("dec", 3);
    expect(count()).toBe("0");
  });

  it("reset returns the count to 0 and the step to 1", () => {
    render(<App />);
    setStep("10"); click("inc", 3);
    fireEvent.click(screen.getByTestId("reset"));
    expect(count()).toBe("0");
    expect(screen.getByTestId("step").value).toBe("1");
  });
});
