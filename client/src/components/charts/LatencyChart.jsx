// src/components/charts/LatencyChart.jsx
// Step response time over time: average (solid) and p95 (dashed) per bucket.
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useChartColors } from "../../lib/theme";
import { bucketRuns, fmtBucket } from "../../lib/buckets";

function Tip({ active, payload, unit, c }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{fmtBucket(d.t, unit, true)}</div>
      <div className="chart-tip-row"><span className="chart-tip-key"><i style={{ background: c.series1 }} />Average</span><b>{d.avgRt != null ? `${d.avgRt.toFixed(2)}s` : "—"}</b></div>
      <div className="chart-tip-row"><span className="chart-tip-key"><i style={{ background: c.series2 }} />p95</span><b>{d.p95Rt != null ? `${d.p95Rt.toFixed(2)}s` : "—"}</b></div>
    </div>
  );
}

export function LatencyChart({ results, height = 220 }) {
  const c = useChartColors();
  const { rows, unit } = useMemo(() => bucketRuns(results), [results]);
  const withData = rows.filter(r => r.avgRt != null);
  if (withData.length < 2) {
    return <div className="empty" style={{ height }}><p>Not enough step timing data in this range yet.</p></div>;
  }
  const last = withData[withData.length - 1];
  return (
    <div>
      <div className="legend" style={{ marginBottom: 10 }}>
        <span><i style={{ background: c.series1, height: 2, width: 14 }} />Average <b className="num" style={{ color: "var(--text-0)" }}>{last.avgRt.toFixed(2)}s</b></span>
        <span><i style={{ background: `repeating-linear-gradient(90deg, ${c.series2} 0 4px, transparent 4px 7px)`, height: 2, width: 14 }} />p95 <b className="num" style={{ color: "var(--text-0)" }}>{last.p95Rt.toFixed(2)}s</b></span>
        <span style={{ marginLeft: "auto", color: "var(--text-3)" }}>latest · per {unit.label}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="t" tickFormatter={t => fmtBucket(t, unit)} tick={{ fill: c.text, fontSize: 11 }}
            axisLine={{ stroke: c.axis }} tickLine={false} minTickGap={24} />
          <YAxis tickFormatter={v => `${v}s`} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} width={46} />
          <Tooltip content={<Tip unit={unit} c={c} />} cursor={{ stroke: c.axis, strokeWidth: 1 }} isAnimationActive={false} />
          <Line type="monotone" dataKey="p95Rt" stroke={c.series2} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} animationDuration={700} />
          <Line type="monotone" dataKey="avgRt" stroke={c.series1} strokeWidth={2} dot={false} connectNulls
            activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
