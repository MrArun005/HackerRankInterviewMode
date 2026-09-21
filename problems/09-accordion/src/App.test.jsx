/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const header = (n) => screen.getByTestId("header-" + n);
const panel  = (n) => screen.queryByTestId("panel-" + n);

describe("Accordion", () => {
  it("renders three headers with every panel closed", () => {
    render(<App />);
    for (let n = 1; n <= 3; n++) {
      expect(header(n)).toBeTruthy();
      expect(panel(n)).toBeNull();
      expect(header(n).getAttribute("aria-expanded")).toBe("false");
    }
  });

  it("opens the section you click", () => {
    render(<App />);
    fireEvent.click(header(2));
    expect(panel(2)).toBeTruthy();
    expect(header(2).getAttribute("aria-expanded")).toBe("true");
  });

  it("opening one closes the other", () => {
    render(<App />);
    fireEvent.click(header(1));
    fireEvent.click(header(3));
    expect(panel(1)).toBeNull();
    expect(panel(3)).toBeTruthy();
  });

  it("clicking an open header closes it", () => {
    render(<App />);
    fireEvent.click(header(2));
    fireEvent.click(header(2));
    expect(panel(2)).toBeNull();
    expect(header(2).getAttribute("aria-expanded")).toBe("false");
  });

  it("wires each header to its panel for assistive tech", () => {
    render(<App />);
    fireEvent.click(header(1));
    const id = header(1).getAttribute("aria-controls");
    expect(id).toBeTruthy();
    expect(panel(1).getAttribute("id")).toBe(id);
  });
});
