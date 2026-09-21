/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./api/leave/route.js";
import Page from "./page.jsx";

const req = (body, method = "POST") =>
  new Request("http://localhost/api/leave", {
    method, headers: { "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });

const good = { startDate: "2026-03-02", endDate: "2026-03-06", reason: "Family wedding out of town" };

const fill = (id, v) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });
const fillGood = () => {
  fill("startDate", good.startDate); fill("endDate", good.endDate); fill("reason", good.reason);
};

describe("POST /api/leave", () => {
  it("accepts a valid request", async () => {
    const res = await POST(req(good));
    expect(res.status).toBe(201);
    expect(await res.json()).toHaveProperty("id");
  });

  it("rejects a short reason with a field error", async () => {
    const res = await POST(req({ ...good, reason: "sick" }));
    expect(res.status).toBe(400);
    const { errors } = await res.json();
    expect(errors.reason).toBe("Reason must be at least 10 characters");
  });

  it("rejects a backwards range", async () => {
    const res = await POST(req({ ...good, endDate: "2026-03-01" }));
    const { errors } = await res.json();
    expect(errors.endDate).toBe("End date cannot be before the start date");
  });

  it("allows exactly the maximum length", async () => {
    const res = await POST(req({ ...good, startDate: "2026-03-01", endDate: "2026-03-30" }));
    expect(res.status).toBe(201);
  });

  it("rejects one day over the maximum", async () => {
    const res = await POST(req({ ...good, startDate: "2026-03-01", endDate: "2026-03-31" }));
    const { errors } = await res.json();
    expect(errors.endDate).toBe("Leave cannot exceed 30 days");
  });

  it("reports every invalid field at once, not just the first", async () => {
    const res = await POST(req({ startDate: "", endDate: "", reason: "no" }));
    const { errors } = await res.json();
    expect(Object.keys(errors).sort()).toEqual(["endDate", "reason", "startDate"]);
  });

  it("survives a body that is not JSON", async () => {
    const bad = new Request("http://localhost/api/leave", { method: "POST", body: "{oops" });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});

describe("the form", () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it("shows the field errors the API returns", async () => {
    global.fetch.mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ errors: { reason: "Reason must be at least 10 characters" } }),
    });
    render(<Page />);
    fillGood(); fill("reason", "sick");
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("error-reason"));
    expect(screen.getByTestId("error-reason").textContent)
      .toBe("Reason must be at least 10 characters");
  });

  it("confirms on success and posts to the right place", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 7 }) });
    render(<Page />);
    fillGood();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("success"));
    expect(global.fetch).toHaveBeenCalledWith("/api/leave", expect.objectContaining({ method: "POST" }));
  });

  it("says something useful when the network itself fails", async () => {
    global.fetch.mockRejectedValue(new Error("offline"));
    render(<Page />);
    fillGood();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("formError"));
    expect(screen.getByTestId("formError").textContent).toContain("Could not submit");
  });
});
