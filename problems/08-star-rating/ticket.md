# Star Rating

- Five stars. Clicking one sets the rating to that many.
- Show the current rating as text.
- A **Clear** button removes the rating.
- Each star is a real button, labelled for screen readers.

**Required data-testids:** `star-1` … `star-5`, `rating`, `clear`

**Read only:** `src/App.test.jsx`, `src/setupTests.js`

> The ticket does not say what the text reads when nothing is chosen, nor what
> happens when you click the star you already picked. The tests do, and one of
> them is the behaviour every real rating widget has.
