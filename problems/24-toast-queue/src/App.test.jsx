/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const add = (n = 1) => { for (let i = 0; i < n; i++) fireEvent.click(screen.getByTestId("add")); };
const toasts = () => screen.queryAllByTestId(/^toast-/);

describe("Toast Queue", () => {
  it("starts empty", () => {
    render(<App />);
    expect(toasts()).toHaveLength(0);
  });

  it("shows a toast when one is raised", () => {
    render(<App />);
    add();
    expect(toasts()).toHaveLength(1);
  });

  it("dismisses it on its own", async () => {
    render(<App />);
    add();
    await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 1500 });
  });

  it("shows no more than the maximum at once", () => {
    render(<App />);
    add(6);
    expect(toasts().length).toBeLessThanOrEqual(3);
  });

  it("can be dismissed by hand before it expires", () => {
    render(<App />);
    add();
    const id = toasts()[0].getAttribute("data-testid").split("-")[1];
    fireEvent.click(screen.getByTestId("close-" + id));
    expect(toasts()).toHaveLength(0);
  });

  it("gives each toast its own timer rather than one shared one", async () => {
    render(<App />);
    add();
    await new Promise((r) => setTimeout(r, 120));
    add();                                   // raised later, must outlive the first
    await waitFor(() => expect(toasts()).toHaveLength(1), { timeout: 1500 });
    await waitFor(() => expect(toasts()).toHaveLength(0), { timeout: 1500 });
  });
});
