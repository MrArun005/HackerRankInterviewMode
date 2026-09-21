# Virtual Window

Render a 1,000-row list without mounting 1,000 rows.

```js
windowFor({ total, rowHeight, viewportHeight, scrollTop, overscan })
// → { start, end, offsetTop, totalHeight }
```

`start`/`end` are a slice — `end` is exclusive. `offsetTop` is where the
mounted slab sits, `totalHeight` keeps the scrollbar honest.

**Required data-testids:** `viewport`, `rows`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Overscan must not push `start` below zero or `end` past the total, and
> `offsetTop` has to line up with the row `start` actually refers to — get
> that wrong and the list jitters as you scroll.
