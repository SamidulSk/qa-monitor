// src/components/ui/KpiCard.jsx
import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Counter, Sparkline } from "./primitives";
import { tv } from "../../lib/format";

/**
 * Stat tile: label · animated value · sub-label · optional sparkline.
 * `tone` drives the icon chip + sparkline; the value stays in text ink.
 * When `value` changes between polls the card flashes and shows a delta,
 * coloured by `upIsGood` (true / false / undefined = neutral).
 */
export function KpiCard({ label, value, sub, tone = "accent", icon: Icon, spark, dec = 0, suffix = "",
                          delay = 0, onClick, selected, alerting, badge, upIsGood }) {
  /* Track the previous value in state (React's recommended pattern — no effect) */
  const [prev, setPrev]   = useState(value);
  const [delta, setDelta] = useState(null);
  if (Number(value) !== Number(prev)) {
    const d = Number(value) - Number(prev);
    setPrev(value);
    // only show changes that are visible at the card's displayed precision
    const shown = dec ? Number(d.toFixed(dec)) : Math.round(d);
    if (Number.isFinite(shown) && shown !== 0) setDelta(old => ({ d: shown, n: (old?.n || 0) + 1 }));
  }

  const deltaTone = !delta ? null
    : upIsGood === undefined ? "neutral"
    : (delta.d > 0) === upIsGood ? "success" : "danger";
  const fmtDelta = d => (dec ? Math.abs(d).toFixed(dec) : Math.abs(Math.round(d)).toLocaleString()) + (suffix || "");

  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`kpi spot fu${onClick ? " clickable" : ""}${selected ? " selected" : ""}${alerting ? " alerting" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {delta && <span key={delta.n} className={`kpi-flash flash-${deltaTone}`} aria-hidden="true" />}
      <div className="kpi-top">
        <div className="kpi-label">
          {Icon && (
            <span className="kpi-icon" style={{ background: `var(--${tone}-bg)`, color: tv(tone) }}>
              <Icon size={13} strokeWidth={2.2} />
            </span>
          )}
          <span title={label}>{label}</span>
        </div>
        {badge}
      </div>
      <div className="kpi-value-row">
        <div className="kpi-value" style={alerting ? { color: "var(--danger)" } : undefined}>
          <Counter to={value} dec={dec} suffix={suffix} />
        </div>
        {delta && (
          <span key={delta.n} className={`kpi-delta delta-${deltaTone}`} title="Change since the previous refresh">
            {delta.d > 0 ? <ArrowUp size={11} strokeWidth={2.6} /> : <ArrowDown size={11} strokeWidth={2.6} />}
            {fmtDelta(delta.d)}
          </span>
        )}
      </div>
      <div className="kpi-foot">
        <span className="kpi-sub">{sub}</span>
        {spark && <Sparkline data={spark} tone={tone} w={68} />}
      </div>
    </Tag>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi" style={{ height: 124 }}>
      <div className="skel" style={{ height: 14, width: "55%" }} />
      <div className="skel" style={{ height: 28, width: "45%" }} />
      <div className="skel" style={{ height: 12, width: "70%" }} />
    </div>
  );
}
