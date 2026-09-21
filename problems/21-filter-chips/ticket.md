# Filter Chips

A people list with two chip facets — department and site — plus a
**contract only** toggle, and a **Clear** button.

- Chips toggle on and off.
- Show `N of M` and an empty state when nothing matches.

`applyFilters()` is pure and tested directly.

**Required data-testids:** `rows`, `chip-dept-{name}`, `chip-site-{name}`,
`contract`, `clear`, `count`, `empty`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> The rule people get wrong: two chips in the *same* facet widen the results,
> two chips in *different* facets narrow them. OR within, AND across.
