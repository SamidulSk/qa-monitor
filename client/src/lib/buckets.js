// src/lib/buckets.js
// Adaptive time bucketing for charts/sparklines. Bucket size follows the span
// of the loaded runs so a 3-hour window and a 30-day window both read well.
const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

const UNITS = [
  { id: "15min", max: 6 * HOUR,  ms: 15 * MIN, label: "15 min" },
  { id: "hour",  max: 2 * DAY,   ms: HOUR,     label: "hour" },
  { id: "day",   max: Infinity,  ms: DAY,      label: "day" },
];

function floorTo(t, unit) {
  const d = new Date(t);
  if (unit.id === "day") { d.setHours(0, 0, 0, 0); return d.getTime(); }
  return Math.floor(t / unit.ms) * unit.ms;
}

/**
 * @returns {{ rows: Array<{t, passed, failed, steps, failedSteps, avgRt, p95Rt}>, unit }}
 * avgRt / p95Rt are step response times (seconds) within the bucket, null when empty.
 * Continuous: empty periods are zero rows rather than gaps.
 */
export function bucketRuns(results) {
  const ts = (results || []).map(r => new Date(r.timestamp).getTime()).filter(Number.isFinite);
  if (!ts.length) return { rows: [], unit: UNITS[1] };
  const min = Math.min(...ts), max = Math.max(...ts);
  const unit = UNITS.find(u => max - min <= u.max);
  const map = new Map();
  const blank = t => ({ t, passed: 0, failed: 0, steps: 0, failedSteps: 0, avgRt: null, p95Rt: null, _rt: [] });
  for (let t = floorTo(min, unit), n = 0; t <= floorTo(max, unit) && n < 500; n++) {
    map.set(t, blank(t));
    t = floorTo(t + unit.ms + (unit.id === "day" ? 2 * HOUR : 0), unit); // DST-safe day step
  }
  results.forEach(r => {
    const k = floorTo(new Date(r.timestamp).getTime(), unit);
    if (!map.has(k)) map.set(k, blank(k));
    const b = map.get(k);
    b[r.has_failure ? "failed" : "passed"]++;
    b.steps += r.total_steps || 0;
    b.failedSteps += r.failed_steps || 0;
    (r.steps || []).forEach(st => { if (Number.isFinite(st.response_time)) b._rt.push(st.response_time); });
  });
  const rows = [...map.values()].sort((a, b) => a.t - b.t);
  rows.forEach(b => {
    if (b._rt.length) {
      const sorted = b._rt.sort((x, y) => x - y);
      b.avgRt = sorted.reduce((a, v) => a + v, 0) / sorted.length;
      b.p95Rt = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
    }
    delete b._rt;
  });
  return { rows, unit };
}

export function fmtBucket(t, unit, full = false) {
  const opts = unit.id === "day"
    ? (full ? { weekday: "short", month: "short", day: "2-digit" } : { month: "short", day: "2-digit" })
    : (full ? { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" } : { hour: "2-digit", minute: "2-digit" });
  return new Date(t).toLocaleString("en-IN", opts);
}
