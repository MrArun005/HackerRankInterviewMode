/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { totals } from "./totals.js";
import { money } from "./money.js";

const text = (id) => screen.getByTestId(id).textContent.trim();
const qty  = (id, v) => fireEvent.change(screen.getByTestId("qty-" + id), { target: { value: String(v) } });

describe("money()", () => {
  it("formats with a thousands separator and two decimals", () => {
    expect(money(123450)).toBe("₹1,234.50");
    expect(money(0)).toBe("₹0.00");
    expect(money(99)).toBe("₹0.99");
  });
});

describe("totals()", () => {
  it("sums line items by quantity", () => {
    const t = totals([{ price: 1000, qty: 3 }, { price: 250, qty: 2 }]);
    expect(t.subtotal).toBe(3500);
  });

  it("adds 18% tax without floating-point drift", () => {
    // 0.1 + 0.2 territory: this must be exact, in integer paise
    const t = totals([{ price: 1010, qty: 1 }]);
    expect(t.tax).toBe(182);              // round(1010 * 0.18) = 181.8 -> 182
    expect(t.total).toBe(1010 + 182 + 499);
  });

  it("charges shipping below the threshold and not on it", () => {
    expect(totals([{ price: 49999, qty: 1 }]).shipping).toBe(499);
    expect(totals([{ price: 50000, qty: 1 }]).shipping).toBe(0);
  });
});

describe("Cart", () => {
  it("renders a row per item with its line total", () => {
    render(<App />);
    expect(screen.getByTestId("rows").children).toHaveLength(3);
    expect(text("line-2")).toBe(money(4550 * 2));
  });

  it("recalculates when a quantity changes", () => {
    render(<App />);
    qty(2, 4);
    expect(text("line-2")).toBe(money(4550 * 4));
    expect(text("subtotal")).toBe(money(24999 + 4550 * 4 + 8999));
  });

  it("removes a line", () => {
    render(<App />);
    fireEvent.click(screen.getByTestId("remove-1"));
    expect(screen.getByTestId("rows").children).toHaveLength(2);
    expect(text("subtotal")).toBe(money(4550 * 2 + 8999));
  });

  it("shows the empty state when everything is removed", () => {
    render(<App />);
    [1, 2, 3].forEach((id) => fireEvent.click(screen.getByTestId("remove-" + id)));
    expect(text("empty")).toBe("Your cart is empty");
    expect(screen.queryByTestId("rows")).toBeNull();
  });
});
