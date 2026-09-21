# React + TypeScript: Leave Request Form

A form for requesting leave, validated before it is sent.

- Three fields: **start date**, **end date**, **reason**.
- Validate on submit. Show one message per invalid field.
- The reason must be at least 10 characters.
- The end date cannot be before the start date.
- Leave may not be longer than 30 days.
- A field's error disappears once that field becomes valid.
- While the request is in flight, disable submit.
- On success show a confirmation; on failure show a message and **keep what
  the user typed**.

## The API

```ts
api.submit(request)   // → Promise<{ id: number }>, may reject
```

**Required data-testids:** `startDate`, `endDate`, `reason`, `submit`,
`error-startDate`, `error-endDate`, `error-reason`, `formError`, `success`

**Read only:** `src/App.test.tsx`, `src/setupTests.ts`

## This one has a second gate

`npm test` runs **`tsc --noEmit` before vitest**. A solution that passes every
test but is red under `strict` does not count. `validate()` must return the
`FieldErrors` type from `types.ts` — not `any`, not a loose record.

> "No longer than 30 days" — decide what happens at exactly 30. The tests have
> an opinion. So does every payroll system that has ever been sued.
