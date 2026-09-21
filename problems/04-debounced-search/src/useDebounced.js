import { useEffect, useState } from "react";

/** Mirror `value` after it has been still for `ms`. Each change cancels the
 *  previous timer, so a burst of keystrokes settles once. */
export function useDebounced(value, ms) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return settled;
}
