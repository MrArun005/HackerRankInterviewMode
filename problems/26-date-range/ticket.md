# Date Range

Two date inputs and a day count.

- Count **inclusive** days — the 2nd to the 4th is three days.
- Refuse a backwards range, or one longer than 30 days.
- Until both dates are set, say so.

**Required data-testids:** `start`, `end`, `days`, `error`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Date arithmetic across a month boundary and across a leap day are both
> tested. Subtracting two `Date` objects and dividing by 86,400,000 is the
> approach that usually gets this wrong.
