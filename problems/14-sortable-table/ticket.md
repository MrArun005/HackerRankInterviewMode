# Sortable Table

A table of people: name, department, joined date, salary.

- Clicking a column header sorts by it.
- Clicking the same header again reverses the order.
- Mark the sorted column with `aria-sort`.

`sortBy(rows, key, asc)` is pure and tested on its own.

**Required data-testids:** `rows`, `sort-name`, `sort-dept`, `sort-joined`,
`sort-salary`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Three things the ticket does not settle and the tests do: whether sorting may
> mutate the array it was given, what happens to two rows with the same value,
> and which direction you get when you move to a different column.
