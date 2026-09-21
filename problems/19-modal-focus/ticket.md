# Modal Focus Trap

A confirmation dialog that behaves for keyboard users.

- A button opens it. The dialog has **Close** and **Confirm**.
- Escape closes it.
- Tab must not escape the dialog.
- Mark it up as a modal dialog.

**Required data-testids:** `open`, `dialog`, `close`, `confirm`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Opening is the easy half. Two things the ticket does not spell out: where
> focus goes when the dialog opens, and where it goes back to when it closes.
> Getting the second one wrong is how keyboard users lose their place.
