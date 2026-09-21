import { useState } from "react";
import { useEmployees } from "./useEmployees.js";
import { PAGE_SIZE } from "./employees.js";
import EmployeeTable from "./EmployeeTable.jsx";
import Pagination from "./Pagination.jsx";

export default function App() {
  const { rows, status, reload } = useEmployees();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? rows.filter((e) => `${e.name} ${e.role}`.toLowerCase().includes(needle))
    : rows;

  // max(1,..) and the clamp travel together: without the first, pageCount can
  // be 0 and the clamp yields page 0 and a negative slice index.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current   = Math.min(page, pageCount);
  const slice     = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (status === "loading") return <p data-testid="loading" className="muted">Loading…</p>;

  if (status === "error") {
    return (
      <div className="card">
        <p data-testid="error">Couldn&apos;t load employees.</p>
        <button data-testid="retry" onClick={reload}>Retry</button>
      </div>
    );
  }

  if (rows.length === 0) return <p data-testid="empty" className="muted">No employees yet.</p>;

  return (
    <div className="card">
      <input
        type="text"
        data-testid="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        placeholder="Search name or role"
        aria-label="Search employees"
      />

      {matches.length === 0 ? (
        <p data-testid="noMatches" className="muted">No matches</p>
      ) : (
        <>
          <EmployeeTable rows={slice} />
          <Pagination pageCount={pageCount} current={current} onChange={setPage} />
        </>
      )}
    </div>
  );
}
