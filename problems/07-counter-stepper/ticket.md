# Counter with Step

- Show a count, starting at 0.
- **+** and **−** buttons move it by the selected step.
- A step selector offering 1, 5 and 10.
- The count cannot go above 100 or below 0.
- **Reset** puts everything back to the start.

**Required data-testids:** `count`, `inc`, `dec`, `step`, `reset`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> "Cannot go above 100" — what should +10 do when you are on 95? And what
> exactly does Reset put back?
