# Expandable Tree

An org tree that expands a level at a time.

- Roots start collapsed. Clicking a toggle opens that node only.
- Leaves have no toggle.
- Mark each row's depth with `aria-level`, starting at 1.

**Required data-testids:** `node-{id}`, `toggle-{id}`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Close a parent whose child was open, then reopen it. Does the child remember?
> Storing "expanded" on the node as it renders loses that; storing it by id
> keeps it.
