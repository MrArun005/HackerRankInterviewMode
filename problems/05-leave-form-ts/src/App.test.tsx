/* READ ONLY — the spec. Do not modify. */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api", () => ({ api: { submit: vi.fn() } }));
const { api } = await import("./api");
const App = (await import("./App")).default;
const { validate } = await import("./validate");

const fill = (id: string, v: string) =>
  fireEvent.change(screen.getByTestId(id), { target: { value: v } });

const good = () => {
  fill("startDate", "2026-03-02");
  fill("endDate", "2026-03-06");
  fill("reason", "Family wedding out of town");
};

beforeEach(() => { (api.submit as ReturnType<typeof vi.fn>).mockReset(); });

describe("validate()", () => {
  it("accepts a range of exactly the maximum length", () => {
    // 2026-03-01 .. 2026-03-30 inclusive is 30 days
    expect(validate({ startDate: "2026-03-01", endDate: "2026-03-30",
                      reason: "Long planned holiday" })).toEqual({});
  });

  it("rejects a range one day over the maximum", () => {
    const errs = validate({ startDate: "2026-03-01", endDate: "2026-03-31",
                            reason: "Long planned holiday" });
    expect(errs.endDate).toBe("Leave cannot exceed 30 days");
  });
});

describe("Leave form", () => {
  it("reports a reason shorter than the minimum", async () => {
    render(<App />);
    good();
    fill("reason", "sick");
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("error-reason"));
    expect(screen.getByTestId("error-reason").textContent)
      .toBe("Reason must be at least 10 characters");
  });

  it("reports an end date before the start date", async () => {
    render(<App />);
    good();
    fill("endDate", "2026-03-01");
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("error-endDate"));
    expect(screen.getByTestId("error-endDate").textContent)
      .toBe("End date cannot be before the start date");
  });

  it("does not call the API while the form is invalid", async () => {
    render(<App />);
    fill("reason", "no");
    fireEvent.click(screen.getByTestId("submit"));
    await new Promise((r) => setTimeout(r, 50));
    expect(api.submit).not.toHaveBeenCalled();
  });

  it("clears a field error once that field becomes valid", async () => {
    render(<App />);
    good();
    fill("reason", "sick");
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("error-reason"));
    fill("reason", "Recovering from flu, doctor advised rest");
    await waitFor(() => expect(screen.queryByTestId("error-reason")).toBeNull());
  });

  it("submits a valid request and confirms", async () => {
    (api.submit as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7 });
    render(<App />);
    good();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("success"));
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.submit).toHaveBeenCalledWith({
      startDate: "2026-03-02", endDate: "2026-03-06",
      reason: "Family wedding out of town",
    });
  });

  it("keeps what you typed when the submission fails", async () => {
    (api.submit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    render(<App />);
    good();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() => screen.getByTestId("formError"));
    expect(screen.getByTestId("formError").textContent).toContain("Could not submit");
    expect((screen.getByTestId("reason") as HTMLInputElement).value)
      .toBe("Family wedding out of town");
  });

  it("disables submit while the request is in flight", async () => {
    (api.submit as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<App />);
    good();
    fireEvent.click(screen.getByTestId("submit"));
    await waitFor(() =>
      expect((screen.getByTestId("submit") as HTMLButtonElement).disabled).toBe(true));
  });
});
