/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const open   = () => screen.getByTestId("open");
const dialog = () => screen.queryByTestId("dialog");

describe("Modal Focus Trap", () => {
  it("is closed to begin with", () => {
    render(<App />);
    expect(dialog()).toBeNull();
  });

  it("opens and moves focus inside", async () => {
    render(<App />);
    fireEvent.click(open());
    await waitFor(() => expect(dialog()).toBeTruthy());
    await waitFor(() => expect(dialog().contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    render(<App />);
    fireEvent.click(open());
    await waitFor(() => expect(dialog()).toBeTruthy());
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(dialog()).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(open()));
  });

  it("wraps Tab from the last control back to the first", async () => {
    render(<App />);
    fireEvent.click(open());
    await waitFor(() => expect(dialog()).toBeTruthy());
    const last = screen.getByTestId("confirm");
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("close")));
  });

  it("wraps Shift+Tab from the first control to the last", async () => {
    render(<App />);
    fireEvent.click(open());
    await waitFor(() => expect(dialog()).toBeTruthy());
    const first = screen.getByTestId("close");
    first.focus();
    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("confirm")));
  });

  it("marks itself as a modal dialog", async () => {
    render(<App />);
    fireEvent.click(open());
    await waitFor(() => expect(dialog()).toBeTruthy());
    expect(dialog().getAttribute("role")).toBe("dialog");
    expect(dialog().getAttribute("aria-modal")).toBe("true");
  });
});
