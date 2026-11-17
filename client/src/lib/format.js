// src/lib/format.js
export const fmtTime = d => new Date(d).toLocaleString("en-IN", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
export const fmtDur  = s => s >= 60 ? `${(s / 60).toFixed(1)} min` : `${(s || 0).toFixed(1)}s`;
export const fmtPct  = n => `${parseFloat(n || 0).toFixed(1)}%`;
export const fmtNum  = n => (Number(n) || 0).toLocaleString();
export const fmtSecs = n => `${(Number(n) || 0).toFixed(2)}s`;

/* Health thresholds — identical to the original healthC() */
export const healthTone = r => {
  const v = parseFloat(r);
  if (v === 0) return "success";
  if (v < 10) return "info";
  if (v < 30) return "warn";
  return "danger";
};

/* Same thresholds as the original statusC() */
export const statusTone = code => {
  const c = parseInt(code);
  if (c >= 200 && c < 300) return "success";
  if (c >= 400 && c < 500) return "warn";
  return "danger";
};

/* Same thresholds as the original badge logic in FailTable / StepAnalytics */
export const severity = rate => (rate === 0 ? "success" : rate < 20 ? "warn" : "danger");

export function relTime(date, now) {
  if (!date) return "—";
  const s = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const tv = tone => `var(--${tone})`;
