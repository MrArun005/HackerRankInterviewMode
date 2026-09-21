# Poll Until Done

Kick off a payroll run and follow it to completion.

- **Run** starts the job, then polls its status every `POLL_MS`.
- Show the state and the progress while it runs.
- Stop polling once the job is `done` or `failed`.
- Give up after `MAX_POLLS` and report a timeout.

## The API

```js
api.start()         // → Promise<{ jobId }>
api.status(jobId)   // → Promise<{ state: "running"|"done"|"failed", progress }>
```

**Required data-testids:** `run`, `state`, `progress`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Two failure modes the ticket does not mention. A poll loop that keeps firing
> after the job has finished is the common one. The one that bites in
> production is a loop that keeps firing after the component is gone.
