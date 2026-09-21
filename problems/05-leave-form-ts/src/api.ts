import type { LeaveRequest } from "./types";

// The tests replace this module. submit() resolves on success, rejects on failure.
export const api = {
  submit: (req: LeaveRequest): Promise<{ id: number }> =>
    new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 400)),
};
