# Accordion

- Three sections, each with a header and a panel.
- Clicking a header opens that section.
- Only one section is open at a time.
- Wire it up for screen readers: `aria-expanded` on the header, and the header
  pointing at its panel.

**Required data-testids:** `header-1` … `header-3`, `panel-1` … `panel-3`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> "Clicking a header opens that section." What does clicking an already-open
> header do? The ticket is silent; the tests are not. Note also that a closed
> panel is expected to be **absent**, not hidden.
