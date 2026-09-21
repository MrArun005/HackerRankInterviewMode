// The tests replace this module.
export const api = { get: (key) => Promise.resolve({ key, at: Date.now() }) };
export const FRESH_MS = 150;
