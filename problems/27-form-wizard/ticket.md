# Form Wizard

Three steps: name, email, then a summary.

- **Next** only advances when the current step is valid.
- **Back** keeps everything already entered.
- The last step shows a summary and the button reads **Submit**.

**Required data-testids:** `step`, `name`, `email`, `next`, `back`, `error`,
`summary`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Going back and forward must not wipe the later step. Unmounting a step and
> keeping its state in that component is the usual way this breaks.
