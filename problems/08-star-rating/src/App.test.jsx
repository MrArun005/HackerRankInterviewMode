/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const star = (n) => screen.getByTestId("star-" + n);
const label = () => screen.getByTestId("rating").textContent.trim();

describe("Star Rating", () => {
  it("renders five stars, nothing selected", () => {
    render(<App />);
    for (let n = 1; n <= 5; n++) expect(star(n)).toBeTruthy();
    expect(label()).toBe("No rating");
  });

  it("selects up to the clicked star", () => {
    render(<App />);
    fireEvent.click(star(3));
    expect(label()).toBe("3 of 5");
    for (let n = 1; n <= 3; n++) expect(star(n).getAttribute("aria-pressed")).toBe("true");
    for (let n = 4; n <= 5; n++) expect(star(n).getAttribute("aria-pressed")).toBe("false");
  });

  it("moves the rating down as well as up", () => {
    render(<App />);
    fireEvent.click(star(4));
    fireEvent.click(star(2));
    expect(label()).toBe("2 of 5");
  });

  it("clicking the current rating clears it", () => {
    render(<App />);
    fireEvent.click(star(3));
    fireEvent.click(star(3));
    expect(label()).toBe("No rating");
    expect(star(3).getAttribute("aria-pressed")).toBe("false");
  });

  it("clear resets to nothing", () => {
    render(<App />);
    fireEvent.click(star(5));
    fireEvent.click(screen.getByTestId("clear"));
    expect(label()).toBe("No rating");
  });

  it("each star is a button with an accessible name", () => {
    render(<App />);
    expect(star(1).tagName).toBe("BUTTON");
    expect(star(1).getAttribute("aria-label")).toBe("1 star");
    expect(star(4).getAttribute("aria-label")).toBe("4 stars");
  });
});
