# React: Employee Directory

A searchable, paginated employee table backed by an async API.

- On mount, call `api.list()` and show a loading state while it is in flight.
- Render the employees in a table with **Name** and **Role** columns.
- Show **4 rows per page**, with a page button per page below the table.
- A search box filters the loaded list by name or role, case-insensitive.
- If the request fails, show an error and a **Retry** button that re-requests.
- If the API returns no employees, say so.
- If the search matches nothing, say so.
- Searching and changing page happen **in memory**. Only mounting and Retry
  may call the API.

## The API

```js
api.list()   // → Promise<Employee[]>, may reject. No arguments.
```

Seed: 11 employees → 3 pages of 4 / 4 / 3.

**Required data-testids:** `search`, `table`, `tableBody`, `pageButtons`,
`page-{n}`, `loading`, `error`, `retry`, `empty`, `noMatches`

**Read only:** the TESTS block.

> The tests are the spec. This ticket does not spell out the exact wording of
> the error, empty and no-match messages, and it says nothing about what the
> page number should do when the search changes. The tests do.
