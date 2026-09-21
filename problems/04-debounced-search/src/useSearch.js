import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api.js";

/** Runs the search for an already-debounced query.
 *  status: idle | loading | error | ready */
export function useSearch(query) {
  const [status, setStatus]   = useState("idle");
  const [results, setResults] = useState([]);
  const [nonce, setNonce]     = useState(0);   // retry re-runs the same query
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setStatus("idle");
      setResults([]);
      return;
    }

    // api.search takes no abort signal, so a superseded request still resolves.
    // It can't be cancelled - it can only be refused. Newest sequence wins.
    const mine = ++seq.current;
    setStatus("loading");
    setResults([]);                 // loading means nothing on screen is current

    api.search(q).then(
      (data) => {
        if (mine !== seq.current) return;
        setResults(data);
        setStatus("ready");
      },
      () => {
        if (mine !== seq.current) return;
        setStatus("error");
      },
    );
  }, [query, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { status, results, retry };
}
