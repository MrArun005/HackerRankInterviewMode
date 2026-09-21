# Character Counter

A note field with a 200-character limit.

- Show how many characters remain.
- Warn the user when they are running out.
- Do not let the text exceed the limit.
- Submit is disabled until there is something to submit.

**Required data-testids:** `note`, `count`, `submit`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> "Warn when running out" — at what point? The tests say, via a `data-state`
> attribute of `ok` or `warn`. They also have an opinion about the wording at
> exactly one character left, and about whitespace-only content.
