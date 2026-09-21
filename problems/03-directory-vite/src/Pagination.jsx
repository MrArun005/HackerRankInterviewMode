export default function Pagination({ pageCount, current, onChange }) {
  return (
    <div className="pages" data-testid="pageButtons">
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          data-testid={`page-${n}`}
          onClick={() => onChange(n)}
          aria-current={n === current}
          style={n === current ? { borderColor: "var(--accent)", color: "var(--accent)" } : undefined}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
