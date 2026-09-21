export default function Results({ status, results, onRetry }) {
  if (status === "idle") {
    return <p data-testid="idle" className="muted">Type to search employees.</p>;
  }

  if (status === "loading") {
    return <p data-testid="loading" className="muted">Searching…</p>;
  }

  if (status === "error") {
    return (
      <div>
        <p data-testid="error">Search failed.</p>
        <button data-testid="retry" onClick={onRetry}>Retry</button>
      </div>
    );
  }

  // searched and came back with nothing - distinct from never having searched
  if (results.length === 0) {
    return <p data-testid="noResults" className="muted">Nothing matched</p>;
  }

  return (
    <ul data-testid="results">
      {results.map((e) => (
        <li key={e.id}>
          <b>{e.name}</b> <i>{e.role}</i>
        </li>
      ))}
    </ul>
  );
}
