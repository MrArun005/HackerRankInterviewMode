import { useState } from "react";
import { useDebounced } from "./useDebounced.js";
import { useSearch } from "./useSearch.js";
import { DEBOUNCE_MS } from "./employees.js";
import Results from "./Results.jsx";

export default function App() {
  const [query, setQuery] = useState("");            // what you typed
  const debounced = useDebounced(query, DEBOUNCE_MS); // what we search for
  const { status, results, retry } = useSearch(debounced);

  return (
    <div className="card">
      <input
        type="text"
        data-testid="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name or role"
        aria-label="Search employees"
      />
      <Results status={status} results={results} onRetry={retry} />
    </div>
  );
}
