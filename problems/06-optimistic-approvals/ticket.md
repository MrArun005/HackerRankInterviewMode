# Optimistic Approvals

A manager's queue of leave requests.

- Load the queue on mount and show one row per request with its status.
- **Approve** marks the row approved **immediately**, without waiting for the
  server, then confirms in the background.
- While a row is being confirmed, its button is disabled. Other rows stay usable.
- If the server refuses, put the row back the way it was and say so on that row.

## The API

```js
api.list()        // → Promise<Request[]>
api.approve(id)   // → Promise<void>, may reject
```

**Required data-testids:** `rows`, `status-{id}`, `approve-{id}`, `error-{id}`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Optimistic updates are easy with one row in flight. The test that matters has
> two: one failing slowly, one succeeding quickly. A rollback that restores a
> snapshot of the whole list will undo the wrong thing.
