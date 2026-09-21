# Currency Input

An amount field that works in **integer paise** underneath.

- Accept what people actually type: `1234.5`, `1,234.56`, `₹ 1,000`.
- Show the parsed value in paise, or an error if it cannot be read.
- Tidy the display when the field loses focus.

`parse()` and `format()` are pure and tested directly.

**Required data-testids:** `amount`, `paise`, `error`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Do not reformat while they are typing — a field that rewrites itself mid-word
> is unusable. And `0.005`: rounded up, or thrown away? Truncation is how you
> lose a paise per transaction and a lot of them per year.
