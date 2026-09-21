/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App.jsx";
import { parse, format } from "./format.js";

const box = () => screen.getByTestId("amount");
const type = (v) => fireEvent.change(box(), { target: { value: v } });

describe("parse()", () => {
  it("reads plain and grouped numbers as paise", () => {
    expect(parse("12")).toBe(1200);
    expect(parse("12.5")).toBe(1250);
    expect(parse("1,234.56")).toBe(123456);
  });
  it("ignores surrounding space and a currency symbol", () => {
    expect(parse("  ₹ 1,000 ")).toBe(100000);
  });
  it("rejects nonsense", () => {
    expect(parse("abc")).toBeNull();
    expect(parse("")).toBeNull();
    expect(parse("1.2.3")).toBeNull();
  });
  it("rounds to whole paise rather than truncating", () => {
    expect(parse("0.005")).toBe(1);
  });
});

describe("format()", () => {
  it("always shows two decimals and groups thousands", () => {
    expect(format(123456)).toBe("1,234.56");
    expect(format(5)).toBe("0.05");
    expect(format(100000)).toBe("1,000.00");
  });
});

describe("Currency Input", () => {
  it("shows an error for an unparseable amount and no value", () => {
    render(<App />);
    type("abc");
    expect(screen.getByTestId("error").textContent).toBe("Enter a valid amount");
    expect(screen.queryByTestId("paise")).toBeNull();
  });

  it("shows the parsed paise for a good amount", () => {
    render(<App />);
    type("1,234.5");
    expect(screen.getByTestId("paise").textContent.trim()).toBe("123450");
    expect(screen.queryByTestId("error")).toBeNull();
  });

  it("reformats on blur but leaves what you typed alone until then", () => {
    render(<App />);
    type("1234.5");
    expect(box().value).toBe("1234.5");
    fireEvent.blur(box());
    expect(box().value).toBe("1,234.50");
  });
});
