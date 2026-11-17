// src/components/charts/ActivityChart.jsx
// Stacked columns: passed vs failed script runs per time bucket, built from
// the run list the API already returned (no extra requests, no synthetic data).
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useChartColors } from "../../lib/theme";
import { bucketRuns, fmtBucket } from "../../lib/buckets";

function Tip({ active, payload, unit, c }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload, total = d.passed + d.failed;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{fmtBucket(d.t, unit, true)}</div>
      <div className="chart-tip-row"><span className="chart-tip-key"><i style={{ background: c.success }} />Passed</span><b>{d.passed}</b></div>
      <div className="chart-tip-row"><span className="chart-tip-key"><i style={{ background: c.danger }} />Failed</span><b>{d.failed}</b></div>
      <div className="chart-tip-row" style={{ borderTop: "1px solid var(--border)", marginTop: 5, paddingTop: 5 }}>
        <span>Total runs</span><b>{total}</b>
      </div>
    </div>
  );
}

export function ActivityChart({ results, height = 240 }) {
  const c = useChartColors();
  const { rows, unit } = useMemo(() => bucketRuns(results), [results]);

  if (!rows.length) {
    return <div className="empty" style={{ height }}><p>No runs in the selected range.</p></div>;
  }
  return (
    <div>
      <div className="legend" style={{ marginBottom: 10 }}>
        <span><i style={{ background: c.success }} />Passed runs</span>
        <span><i style={{ background: c.danger }} />Failed runs</span>
        <span style={{ marginLeft: "auto", color: "var(--text-3)" }}>per {unit.label}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="t" tickFormatter={t => fmtBucket(t, unit)} tick={{ fill: c.text, fontSize: 11 }}
            axisLine={{ stroke: c.axis }} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
          <Tooltip content={<Tip unit={unit} c={c} />} cursor={{ fill: c.grid, opacity: .6 }} isAnimationActive={false} />
          <Bar dataKey="passed" stackId="runs" fill={c.success} stroke={c.surface} strokeWidth={1} maxBarSize={28} animationDuration={600} />
          <Bar dataKey="failed" stackId="runs" fill={c.danger} stroke={c.surface} strokeWidth={1} maxBarSize={28} radius={[4, 4, 0, 0]} animationDuration={600} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
