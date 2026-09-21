# React: Debounced Search

Search employees against an async API as the user types.

- A single search box. While it is empty, show a prompt and **make no request**.
- Wait for the user to stop typing before searching — don't fire per keystroke.
- Show a loading state while a request is in flight.
- Render the matching employees.
- If the API fails, show a message and a **Retry** button.
- If nothing matches, say so.

## The API

```js
api.search(query)   // → Promise<Employee[]>, may reject
```

`DEBOUNCE_MS` is exported from `employees.js`.

**Required data-testids:** `search`, `results`, `loading`, `error`, `retry`,
`noResults`, `idle`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

## Files

`useDebounced.js` and `useSearch.js` are stubs that throw. `Results.jsx` and
`App.jsx` are empty. How you split the work between them is your call — the
tests only touch the rendered output.

> The ticket says nothing about what happens when two requests are in flight
> at once. One of the tests does, and it is the one that matters.
