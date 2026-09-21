# Tabs with Keyboard

Three tabs — **Overview**, **Members**, **Billing** — and one panel.

- Clicking a tab selects it.
- Left and Right arrows move between tabs; Home and End jump to the ends.
- Mark the selected tab with `aria-selected`.

**Required data-testids:** `tab-1`, `tab-2`, `tab-3`, `panel`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Two things the ticket leaves out and the tests insist on: what an arrow key
> does at the last tab, and what `tabIndex` each tab carries. A tab strip where
> every tab is tabbable is the most common accessibility mistake in this widget.
