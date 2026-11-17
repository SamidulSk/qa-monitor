// src/components/monitoring/FailTable.jsx
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ShieldCheck, CircleAlert, TriangleAlert, CircleCheck } from "lucide-react";
import { Badge, EmptyState, Meter } from "../ui/primitives";
import { fmtPct, fmtTime, healthTone, severity } from "../../lib/format";

const COLS = [
  { k: "_id",               l: "Step name" },
  { k: "failures",          l: "Failures",     num: true },
  { k: "total",             l: "Runs",         num: true },
  { k: "failure_rate",      l: "Failure rate" },
  { k: "avg_response_time", l: "Avg response", num: true },
  { k: "last_run",          l: "Last seen" },
];

const SEV = {
  success: { label: "Nominal",  icon: CircleCheck },
  warn:    { label: "Degraded", icon: TriangleAlert },
  danger:  { label: "Critical", icon: CircleAlert },
};

/* Sorting + filtering semantics preserved from the original FailTable */
export function FailTable({ summary, limit }) {
  const [sort, setSort] = useState({ k: "failures", d: "desc" });
  let rows = [...(summary?.by_step || [])].filter(s => s.failures > 0).sort((a, b) => {
    const av = a[sort.k], bv = b[sort.k];
    return sort.d === "desc" ? bv - av : av - bv;
  });
  const totalRows = rows.length;
  if (limit) rows = rows.slice(0, limit);
  const tog = k => setSort(s => ({ k, d: s.k === k && s.d === "desc" ? "asc" : "desc" }));

  if (!rows.length) return (
    <EmptyState icon={ShieldCheck} tone="success" title="All systems nominal">
      No failures in the selected time range.
    </EmptyState>
  );

  return (
    <>
      <div className="table-wrap">
        <table className="dt">
          <thead>
            <tr>
              {COLS.map(c => {
                const on = sort.k === c.k;
                const Icon = on ? (sort.d === "desc" ? ArrowDown : ArrowUp) : ArrowUpDown;
                return (
                  <th key={c.k} className={`sortable${on ? " sorted" : ""}`} onClick={() => tog(c.k)} aria-sort={on ? (sort.d === "desc" ? "descending" : "ascending") : "none"}>
                    <span className="th-in">{c.l}<Icon size={12} style={{ opacity: on ? 1 : .4 }} /></span>
                  </th>
                );
              })}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => {
              const rate = parseFloat(s.failure_rate) || 0;
              const sev = SEV[severity(rate)];
              return (
                <tr key={s._id} className="hoverable fu" style={{ animationDelay: `${Math.min(i, 20) * 15}ms` }}>
                  <td style={{ maxWidth: 340, minWidth: 180 }}><div className="strong truncate" title={s._id}>{s._id}</div></td>
                  <td><span className="num" style={{ fontSize: 15, fontWeight: 650, color: "var(--danger)" }}>{s.failures}</span></td>
                  <td className="mono muted">{s.total}</td>
                  <td style={{ minWidth: 170 }}>
                    <div className="row" style={{ gap: 10 }}>
                      <Meter value={rate} tone={healthTone(rate)} width={88} />
                      <span className="mono" style={{ color: `var(--${healthTone(rate)})`, fontWeight: 600, minWidth: 46 }}>{fmtPct(rate)}</span>
                    </div>
                  </td>
                  <td className="mono">{s.avg_response_time?.toFixed(2)}s</td>
                  <td className="nowrap muted">{s.last_run ? fmtTime(s.last_run) : "—"}</td>
                  <td><Badge tone={severity(rate)} icon={sev.icon}>{sev.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {limit && totalRows > limit && (
        <div className="pager"><span>Showing top {limit} of {totalRows} failing steps</span></div>
      )}
    </>
  );
}
