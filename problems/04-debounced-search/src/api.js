import { EMPLOYEES } from "./employees.js";

// Server-side search. The tests replace this module; keep the shape:
// search(query) -> Promise<Employee[]>, and it may reject.
export const api = {
  search: (query) =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            EMPLOYEES.filter((e) =>
              `${e.name} ${e.role}`.toLowerCase().includes(query.toLowerCase()),
            ),
          ),
        300,
      ),
    ),
};
