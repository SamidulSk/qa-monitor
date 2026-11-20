// src/components/ui/primitives.jsx
// Small, stateless building blocks shared by every page.
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, X, CircleCheck, CircleX } from "lucide-react";
import { tv } from "../../lib/format";
import { useSlidingIndicator } from "../../hooks/useSlidingIndicator";

/* ─── Panel ─────────────────────────────────────────────────── */
export function Panel({ title, sub, icon: Icon, actions, children, className = "", bodyClass, style, plainHead }) {
  return (
    <section className={`panel ${className}`} style={style}>
      {(title || actions) && (
        <header className={`panel-head${plainHead ? " plain" : ""}`}>
          <div className="panel-title">
            {Icon && <div className="panel-icon"><Icon size={15} /></div>}
            <div>
              {title && <h3>{title}</h3>}
              {sub && <p>{sub}</p>}
            </div>
          </div>
          {actions && <div className="row">{actions}</div>}
        </header>
      )}
      {bodyClass !== undefined ? <div className={bodyClass}>{children}</div> : children}
    </section>
  );
}

/* ─── Badge ─────────────────────────────────────────────────── */
export function Badge({ tone = "neutral", mono, dot, icon: Icon, children, className = "", title, pulse }) {
  return (
    <span className={`badge badge-${tone}${mono ? " mono" : ""}${pulse ? " pulse" : ""} ${className}`} title={title}>
      {dot && <i className="dot" />}
      {Icon && <Icon size={12} strokeWidth={2.4} />}
      {children}
    </span>
  );
}

export function RunStatus({ failed }) {
  return failed
    ? <Badge tone="danger" icon={CircleX}>Failed</Badge>
    : <Badge tone="success" icon={CircleCheck}>Passed</Badge>;
}

export function BuildBadge({ build, tone = "build" }) {
  return <Badge tone={build ? tone : "neutral"} mono>{build ? `#${build}` : "—"}</Badge>;
}

/* ─── Animated counter ──────────────────────────────────────── */
export function Counter({ to, dec = 0, suffix = "" }) {
  const [v, setV] = useState(0);
  const raf = useRef(); const prev = useRef(0);
  useEffect(() => {
    const target = parseFloat(to) || 0, from = prev.current;
    prev.current = target;
    const t0 = Date.now(), dur = 750;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{dec ? v.toFixed(dec) : Math.round(v).toLocaleString()}{suffix && <small>{suffix}</small>}</>;
}

/* ─── Sparkline ─────────────────────────────────────────────── */
export function Sparkline({ data = [], tone = "accent", w = 84, h = 28 }) {
  const id = useId().replace(/:/g, "");
  if (!data || data.length < 2) return <div style={{ width: w, height: h }} />;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - 3 - (v / max) * (h - 6) }));
  const line = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const c = tv(tone);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible", flexShrink: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: c, stopOpacity: .22 }} />
          <stop offset="100%" style={{ stopColor: c, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polygon className="spark-area" points={`0,${h} ${line} ${w},${h}`} fill={`url(#sp${id})`} />
      <polyline className="spark-line" pathLength="1" points={line} fill="none" style={{ stroke: c }} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      <circle className="spark-dot" cx={last.x} cy={last.y} r="2.75" style={{ fill: c, stroke: "var(--surface)" }} strokeWidth="1.5" />
    </svg>
  );
}

/* ─── Health ring ───────────────────────────────────────────── */
export function HealthRing({ value = 100, tone = "success", size = 64, stroke = 6, label = "HEALTH" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const c = tv(tone);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }} role="img" aria-label={`${label} ${Math.round(v)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: "var(--surface-3)" }} strokeWidth={stroke} />
      <circle className="ring-prog" cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: c, transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${circ * (v / 100)} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y={size / 2 + (label ? -1 : 4)} textAnchor="middle" style={{ fill: "var(--text-0)", fontWeight: 650, fontSize: size * 0.2, letterSpacing: "-.02em" }}>
        {Math.round(v)}%
      </text>
      {label && (
        <text x="50%" y={size / 2 + size * 0.17} textAnchor="middle" style={{ fill: "var(--text-3)", fontSize: Math.max(8, size * 0.115), fontWeight: 600, letterSpacing: ".06em" }}>
          {label}
        </text>
      )}
    </svg>
  );
}

/* ─── Meter (progress bar) ──────────────────────────────────── */
export function Meter({ value = 0, tone = "accent", width }) {
  return (
    <div className="meter" style={width ? { flex: "0 0 auto", width } : undefined}>
      <i style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: tv(tone) }} />
    </div>
  );
}

/* ─── Steps tally (passed / failed / total) ─────────────────── */
export function StepsTally({ passed = 0, failed = 0, total = 0 }) {
  const t = total || passed + failed || 1;
  return (
    <span className="steps-tally">
      <span className="tally-bar" aria-hidden="true">
        <i style={{ width: `${(passed / t) * 100}%`, background: "var(--success)" }} />
        {failed > 0 && <i style={{ width: `${(failed / t) * 100}%`, background: "var(--danger)" }} />}
      </span>
      <span className="ok">{passed}</span>
      {failed > 0 && <span className="bad" title={`${failed} failed`}>{failed}<X size={11} strokeWidth={3} /></span>}
      <span className="of">/ {total}</span>
    </span>
  );
}

/* ─── Empty state ───────────────────────────────────────────── */
export function EmptyState({ icon: Icon, tone = "text-3", title, children }) {
  return (
    <div className="empty fi">
      {Icon && <div className="empty-icon" style={{ color: tv(tone) }}><Icon size={20} /></div>}
      <h4>{title}</h4>
      {children && <p>{children}</p>}
    </div>
  );
}

/* ─── Paginator ─────────────────────────────────────────────── */
export function Paginator({ page, pages, setPage, total, per }) {
  if (pages <= 1) return null;
  const start = (page - 1) * per + 1, end = Math.min(page * per, total);
  return (
    <div className="pager">
      <span className="num">{total != null ? `Showing ${start}–${end} of ${total}` : ""}</span>
      <div className="pager-btns">
        <button className="btn btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          <ChevronLeft size={14} /> Prev
        </button>
        <span>Page {page} / {pages}</span>
        <button className="btn btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Segmented control ─────────────────────────────────────── */
export function Segmented({ options, value, onChange, ariaLabel }) {
  const boxRef = useRef(null), thumbRef = useRef(null);
  useSlidingIndicator(boxRef, thumbRef, "button.on", [value, options.length]);
  return (
    <div className="seg has-thumb" role="tablist" aria-label={ariaLabel} ref={boxRef}>
      <span className={`seg-thumb${options.find(o => o.id === value)?.alert ? " alert" : ""}`} ref={thumbRef} aria-hidden="true" />
      {options.map(o => {
        const Icon = o.icon;
        return (
          <button key={o.id} role="tab" aria-selected={value === o.id}
            className={`${value === o.id ? "on" : ""}${o.alert ? " alert" : ""}`}
            onClick={() => onChange(o.id)}
            style={o.alert && value !== o.id ? { color: "var(--danger)" } : undefined}>
            {Icon && <Icon size={13} />}
            {o.label}
            {o.count != null && <span className="seg-count">{o.count}</span>}
            {o.alert && <i className="dot" style={{ background: "var(--danger)", animation: "pulse 1.5s ease infinite" }} />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Form fields ───────────────────────────────────────────── */
export function SelectField({ icon: Icon, value, onChange, placeholder, options, ariaLabel }) {
  return (
    <label className={`field${value ? " active" : ""}`}>
      {Icon && <Icon size={14} />}
      <select value={value || ""} onChange={e => onChange(e.target.value)} aria-label={ariaLabel || placeholder}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown size={14} className="chev" />
    </label>
  );
}

export function SearchField({ value, onChange, placeholder, className = "" }) {
  return (
    <label className={`field field-search ${className}`}>
      <Search size={14} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && (
        <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 26, height: 26, marginRight: 3 }}
          onClick={(e) => { e.preventDefault(); onChange(""); }} aria-label="Clear search">
          <X size={13} />
        </button>
      )}
    </label>
  );
}
