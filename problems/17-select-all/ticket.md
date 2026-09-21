# Select All

Four rows, each with a checkbox, and a **select all** box in the header.

- The header box ticks or clears every row.
- It reflects the rows: checked when all are, clear when none are.
- Show how many are selected.

**Required data-testids:** `select-all`, `row-1` … `row-4`, `count`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> A header box has three states, not two. `checked` cannot express the middle
> one — the tests check `indeterminate`, which React will not set from JSX.
> And clicking it from that middle state: select all, or clear all?
