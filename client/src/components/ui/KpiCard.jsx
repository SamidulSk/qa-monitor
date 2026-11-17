// src/components/ui/KpiCard.jsx
import { Counter, Sparkline } from "./primitives";
import { tv } from "../../lib/format";

/**
 * Stat tile: label · animated value · sub-label · optional sparkline.
 * `tone` drives the icon chip + sparkline; the value stays in text ink.
 */
export function KpiCard({ label, value, sub, tone = "accent", icon: Icon, spark, dec = 0, suffix = "",
                          delay = 0, onClick, selected, alerting, badge }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`kpi fu${onClick ? " clickable" : ""}${selected ? " selected" : ""}${alerting ? " alerting" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
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
      <div className="kpi-value" style={alerting ? { color: "var(--danger)" } : undefined}>
        <Counter to={value} dec={dec} suffix={suffix} />
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
