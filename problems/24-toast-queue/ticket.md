# Toast Queue

A button that raises notifications.

- Each toast disappears on its own after `TOAST_MS`.
- Never show more than `MAX_VISIBLE` at once.
- Each has a close button.

**Required data-testids:** `add`, `toast-{id}`, `close-{id}`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> One `setTimeout` that clears the list is the tempting shortcut, and it is
> wrong the moment two toasts are raised a moment apart — the second one
> inherits the first one's deadline.
