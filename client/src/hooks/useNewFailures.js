// src/hooks/useNewFailures.js
// Detects failed runs that arrived since the previous poll. Purely observes the
// data the dashboard already fetched.
//
// False-positive guards:
//  • first successful load only sets a baseline
//  • a filter change re-baselines on the next data arrival
//  • a run must be unseen AND newer than everything seen before AND recent (≤ 30 min)
import { useEffect, useRef } from "react";

const RECENT_MS = 30 * 60e3;

export function useNewFailures({ results, lastUpdated, filterKey, onNew }) {
  const seen    = useRef(null);
  const maxTs   = useRef(0);
  const keyRef  = useRef(filterKey);
  const onNewRef = useRef(onNew);
  useEffect(() => { onNewRef.current = onNew; }, [onNew]);

  useEffect(() => { if (keyRef.current !== filterKey) { keyRef.current = filterKey; seen.current = null; } }, [filterKey]);

  useEffect(() => {
    if (!lastUpdated) return;
    const ts = r => new Date(r.timestamp).getTime() || 0;
    if (seen.current === null) {
      seen.current = new Set(results.map(r => r._id));
      maxTs.current = Math.max(0, ...results.map(ts));
      return;
    }
    const now = Date.now();
    const fresh = results.filter(r => !seen.current.has(r._id));
    const failed = fresh.filter(r => r.has_failure && ts(r) > maxTs.current && now - ts(r) <= RECENT_MS);
    fresh.forEach(r => seen.current.add(r._id));
    maxTs.current = Math.max(maxTs.current, ...fresh.map(ts));
    if (failed.length) onNewRef.current?.(failed);
  }, [results, lastUpdated]);
}
