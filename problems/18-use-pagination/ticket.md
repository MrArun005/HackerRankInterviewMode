# Pagination Hook

A pure function describing a page of results.

```js
usePagination({ total, pageSize, page })
// → { pageCount, page, from, to, hasPrev, hasNext }
```

`from` and `to` are **1-based and inclusive** — the numbers you would put in
"showing 21–30 of 95".

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Every interesting case here is an edge: an empty total, a page past the end,
> a page below one, and a last page that isn't full. The happy path is one test
> out of six.
