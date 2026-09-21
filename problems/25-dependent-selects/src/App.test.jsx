/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";

const sel = (id) => screen.getByTestId(id);
const pick = (id, v) => fireEvent.change(sel(id), { target: { value: v } });
const options = (id) => [...sel(id).options].map((o) => o.value).filter(Boolean);

describe("Dependent Selects", () => {
  it("offers countries, with state and city empty", () => {
    render(<App />);
    expect(options("country")).toEqual(["India", "United States"]);
    expect(options("state")).toEqual([]);
    expect(options("city")).toEqual([]);
  });

  it("fills the states once a country is chosen", () => {
    render(<App />);
    pick("country", "India");
    expect(options("state")).toEqual(["Karnataka", "Tamil Nadu"]);
    expect(options("city")).toEqual([]);
  });

  it("fills the cities once a state is chosen", () => {
    render(<App />);
    pick("country", "India");
    pick("state", "Karnataka");
    expect(options("city")).toEqual(["Bengaluru", "Mysuru"]);
  });

  it("clears the children when the country changes", () => {
    render(<App />);
    pick("country", "India");
    pick("state", "Karnataka");
    pick("city", "Mysuru");
    pick("country", "United States");
    expect(sel("state").value).toBe("");
    expect(sel("city").value).toBe("");
    expect(options("city")).toEqual([]);
  });

  it("clears only the city when the state changes", () => {
    render(<App />);
    pick("country", "India");
    pick("state", "Karnataka");
    pick("city", "Mysuru");
    pick("state", "Tamil Nadu");
    expect(sel("country").value).toBe("India");
    expect(sel("city").value).toBe("");
  });

  it("disables a select with nothing to choose", () => {
    render(<App />);
    expect(sel("state").disabled).toBe(true);
    pick("country", "India");
    expect(sel("state").disabled).toBe(false);
    expect(sel("city").disabled).toBe(true);
  });

  it("summarises a complete selection", () => {
    render(<App />);
    pick("country", "India"); pick("state", "Karnataka"); pick("city", "Bengaluru");
    expect(screen.getByTestId("summary").textContent).toBe("Bengaluru, Karnataka, India");
  });
});
