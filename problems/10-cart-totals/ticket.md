# Cart Totals

A cart with editable quantities and a totals panel.

- One row per item: name, unit price, quantity input, line total, remove button.
- Totals: subtotal, 18% tax, shipping, grand total.
- Shipping is ₹499, free once the subtotal reaches ₹50,000.
- When the cart is emptied, say so.

All prices are **integer paise** — `24999` is ₹249.99. `money()` turns paise
into a display string.

**Required data-testids:** `rows`, `qty-{id}`, `line-{id}`, `remove-{id}`,
`subtotal`, `tax`, `shipping`, `total`, `empty`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> Money in floating point is how you end up with a total of ₹1,234.4999999998.
> `totals()` is tested directly, in paise, and the numbers are chosen to catch it.
> Note also where free shipping starts: "once the subtotal reaches ₹50,000."
