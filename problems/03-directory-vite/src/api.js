import { EMPLOYEES } from "./employees.js";

// The tests replace this module. Keep the shape: list() takes no arguments
// and resolves to an array, or rejects.
export const api = {
  list: () => new Promise((resolve) => setTimeout(() => resolve(EMPLOYEES), 450)),
};
