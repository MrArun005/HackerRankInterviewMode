# Password Field

- A password input with a **Show / Hide** toggle.
- The toggle is a button, labelled for screen readers, and reports its state.
- Below the field, a strength word: **Weak**, **Fair** or **Strong**.
- Under 8 characters is weak; 12 or more is strong.

**Required data-testids:** `password`, `toggle`, `strength`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> The boundaries: is 8 characters weak or fair? Is 12 fair or strong? And what
> should the strength line say before anything has been typed?
