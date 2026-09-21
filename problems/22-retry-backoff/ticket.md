# Retry with Backoff

Loading a report that sometimes fails.

- Retry a failed call, waiting longer each time, starting at `BASE_MS`.
- Stop after `MAX_TRIES` attempts in total and surface the error.
- Show which attempt is in progress.

```js
withRetry(fn, { onAttempt })   // → the value, or throws the last error
```

**Required data-testids:** `load`, `attempt`, `rows`, `error`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> `MAX_TRIES` counts the first attempt, not just the retries — off by one here
> means one extra hit on a service that is already struggling. And do not sleep
> after the final failure: nobody is waiting on that pause.
