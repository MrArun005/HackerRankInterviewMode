/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const step  = () => screen.getByTestId("step").textContent.trim();
const next  = () => fireEvent.click(screen.getByTestId("next"));
const back  = () => fireEvent.click(screen.getByTestId("back"));
const fill  = (id, v) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });

describe("Form Wizard", () => {
  it("starts on step 1 with Back unavailable", () => {
    render(<App />);
    expect(step()).toBe("Step 1 of 3");
    expect(screen.getByTestId("back").disabled).toBe(true);
  });

  it("will not advance while the step is invalid", () => {
    render(<App />);
    next();
    expect(step()).toBe("Step 1 of 3");
    expect(screen.getByTestId("error").textContent).toContain("Name is required");
  });

  it("advances once the step is valid", () => {
    render(<App />);
    fill("name", "Arun");
    next();
    expect(step()).toBe("Step 2 of 3");
    expect(screen.queryByTestId("error")).toBeNull();
  });

  it("keeps what you entered when you go back", () => {
    render(<App />);
    fill("name", "Arun"); next();
    fill("email", "a@b.co"); next();
    back(); back();
    expect(screen.getByTestId("name").value).toBe("Arun");
    next();
    expect(screen.getByTestId("email").value).toBe("a@b.co");
  });

  it("validates the second step too", () => {
    render(<App />);
    fill("name", "Arun"); next();
    fill("email", "nope"); next();
    expect(step()).toBe("Step 2 of 3");
    expect(screen.getByTestId("error").textContent).toContain("valid email");
  });

  it("summarises everything on the last step", () => {
    render(<App />);
    fill("name", "Arun"); next();
    fill("email", "a@b.co"); next();
    expect(step()).toBe("Step 3 of 3");
    expect(screen.getByTestId("summary").textContent).toContain("Arun");
    expect(screen.getByTestId("summary").textContent).toContain("a@b.co");
    expect(screen.getByTestId("next").textContent.trim()).toBe("Submit");
  });
});
