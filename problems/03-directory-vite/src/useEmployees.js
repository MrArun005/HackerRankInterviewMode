import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

/** Owns the request lifecycle and nothing else. Filtering and paging are the
 *  caller's business, and must not cause a refetch. */
export function useEmployees() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");   // loading | ready | error

  const load = useCallback(() => {
    setStatus("loading");
    api.list().then(
      (data) => { setRows(data); setStatus("ready"); },
      ()     => { setStatus("error"); },
    );
  }, []);                                            // closes over nothing that varies

  useEffect(() => { load(); }, [load]);

  return { rows, status, reload: load };
}
