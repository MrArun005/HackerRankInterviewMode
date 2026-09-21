# Dependent Selects

Country → State → City, each filling the next.

- A select with nothing to offer is disabled.
- Show the full selection once all three are chosen.

**Required data-testids:** `country`, `state`, `city`, `summary`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Changing the country while a city is already chosen is the case that matters.
> Leaving a stale child selected is how forms submit "Bengaluru, California".
