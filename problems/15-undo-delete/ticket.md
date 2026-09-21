# Delete with Undo

A list where deleting is reversible for a moment.

- Clicking **Delete** removes the row from the list straight away.
- An **Undo** appears for a short window (`UNDO_MS`).
- If the user undoes, nothing is ever sent to the server.
- Otherwise the delete is committed when the window closes.
- If the server refuses, put the row back and say so.

## The API

```js
api.remove(id)   // → Promise<void>, may reject
```

**Required data-testids:** `rows`, `delete-{id}`, `undo`, `error`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Undo must restore the row **where it was**, not at the end. And think about
> deleting a second row while the first is still undoable — the tests do.
