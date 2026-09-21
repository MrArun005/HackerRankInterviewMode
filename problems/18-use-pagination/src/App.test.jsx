/* READ ONLY — the spec. Do not modify. */
import { describe, it, expect } from "vitest";
import { usePagination } from "./usePagination.js";

const p = (total, pageSize, page) => usePagination({ total, pageSize, page });

describe("usePagination()", () => {
  it("describes a normal page", () => {
    expect(p(95, 10, 3)).toEqual({
      pageCount: 10, page: 3, from: 21, to: 30, hasPrev: true, hasNext: true,
    });
  });

  it("gives a short last page the right range", () => {
    expect(p(95, 10, 10)).toMatchObject({ from: 91, to: 95, hasNext: false });
  });

  it("never reports fewer than one page", () => {
    expect(p(0, 10, 1)).toMatchObject({ pageCount: 1, from: 0, to: 0, hasNext: false });
  });

  it("clamps a page beyond the end", () => {
    expect(p(30, 10, 99)).toMatchObject({ page: 3, from: 21, to: 30, hasNext: false });
  });

  it("clamps a page below the start", () => {
    expect(p(30, 10, 0)).toMatchObject({ page: 1, from: 1, to: 10, hasPrev: false });
  });

  it("handles a total smaller than one page", () => {
    expect(p(4, 10, 1)).toMatchObject({ pageCount: 1, from: 1, to: 4, hasNext: false });
  });
});
