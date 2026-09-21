// The tests replace this module.
// A payroll run: start it, then poll until it finishes or fails.
export const api = {
  start: () => new Promise((r) => setTimeout(() => r({ jobId: "j1" }), 100)),
  status: (jobId) => new Promise((r) => setTimeout(() => r({ state: "done", progress: 100 }), 100)),
};

export const POLL_MS = 60;
export const MAX_POLLS = 20;
