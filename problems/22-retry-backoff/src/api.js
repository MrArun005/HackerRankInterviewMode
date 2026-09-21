// The tests replace this module.
export const api = { fetchReport: () => Promise.resolve({ rows: 3 }) };

export const BASE_MS = 40;     // first wait
export const MAX_TRIES = 4;    // including the first attempt
