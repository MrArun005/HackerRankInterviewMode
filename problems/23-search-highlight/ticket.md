# Search Highlight

Filterless highlighting: show every name, marking the part that matches.

```js
highlight(text, query)   // → [{ text, match }]
```

Render matched parts inside an element with `data-testid="mark"`.

**Required data-testids:** `q`, `mark`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> The obvious implementation builds a `RegExp` from the query. Type `(` into
> the box and see what happens. Case-insensitive matching must not change the
> letters that come back, either.
