// src/lib/insights.js — derived views over the run list (read-only)

/** Latest-run status per product + recent pass history (newest last). */
export function productStatus(results, historyLen = 30) {
  const by = new Map();
  (results || []).forEach(r => {           // API order: newest first
    if (!by.has(r.project)) by.set(r.project, []);
    by.get(r.project).push(r);
  });
  return [...by.entries()].map(([name, runs]) => ({
    name,
    latest: runs[0],
    failing: !!runs[0]?.has_failure,
    history: runs.slice(0, historyLen).reverse(),
    passRate: runs.length ? (runs.filter(r => !r.has_failure).length / runs.length) * 100 : 100,
  }));
}

/** Most recent failed runs with their failing step names. */
export function recentIncidents(results, limit = 6) {
  return (results || [])
    .filter(r => r.has_failure)
    .slice(0, limit)
    .map(r => ({ run: r, failedSteps: (r.steps || []).filter(s => !s.is_success).map(s => s.step) }));
}
