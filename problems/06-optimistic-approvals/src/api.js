import { REQUESTS } from "./requests.js";

// The tests replace this module.
export const api = {
  list: () => new Promise((r) => setTimeout(() => r(REQUESTS), 300)),
  approve: (id) => new Promise((r) => setTimeout(r, 400)),   // may reject
};
