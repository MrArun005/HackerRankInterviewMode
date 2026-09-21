# Next.js: Leave API

Two halves of the same feature — a route handler and the form that calls it.

## The route handler

`app/api/leave/route.js`, a Next.js App Router handler. Plain function:
a `Request` goes in, a `Response` comes out.

- **201** `{ id }` for a valid request.
- **400** `{ errors: { field: message } }` for an invalid one.
- The reason must be at least 10 characters.
- The end date cannot be before the start date.
- Leave may not exceed 30 days.

## The form

`app/page.jsx`, a client component. Post to `/api/leave`, show the field
errors the API sends back, confirm on success.

**Required data-testids:** `startDate`, `endDate`, `reason`, `submit`,
`error-startDate`, `error-endDate`, `error-reason`, `formError`, `success`

**Read only:** `app/page.test.jsx`, `app/setupTests.js`

> Validation lives on the server because the client can be skipped. Two things
> the ticket leaves open: whether one bad field or all of them come back, and
> what a handler does with a body that isn't JSON at all. A handler that throws
> on malformed input is a 500 where a 400 belongs.
