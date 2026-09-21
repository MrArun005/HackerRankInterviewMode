# Stale While Revalidate

A small cache with the behaviour every data library ends up implementing.

```js
createCache({ fetcher, freshMs, onChange })
// → { read(key) }   // { data, stale } | null
```

- A miss returns `null` and starts a fetch.
- A fresh hit returns the data and fetches nothing.
- A stale hit returns the old data **immediately** and refreshes in the
  background.
- Call `onChange` when there is new data to render.

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Three things separate this from a plain map. Three reads of the same cold key
> must cause one fetch, not three. Keys must not share state. And a refresh
> that fails must not throw away the data you already had — showing stale data
> beats showing nothing.
