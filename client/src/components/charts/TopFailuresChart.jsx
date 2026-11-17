// src/components/charts/TopFailuresChart.jsx
// Horizontal bars: steps ranked by failure count (from /summary by_step).
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import { useChartColors } from "../../lib/theme";
import { fmtPct } from "../../lib/format";

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="chart-tip" style={{ maxWidth: 320 }}>
      <div className="chart-tip-title" style={{ whiteSpace: "normal" }}>{s.name}</div>
      <div className="chart-tip-row"><span>Failures</span><b>{s.failures}</b></div>
      <div className="chart-tip-row"><span>Executions</span><b>{s.total}</b></div>
      <div className="chart-tip-row"><span>Failure rate</span><b>{fmtPct(s.rate)}</b></div>
      <div className="chart-tip-row"><span>Avg response</span><b>{(s.avg || 0).toFixed(2)}s</b></div>
    </div>
  );
}

export function TopFailuresChart({ byStep, limit = 8 }) {
  const c = useChartColors();
  const rows = useMemo(() => [...(byStep || [])]
    .filter(s => s.failures > 0)
    .sort((a, b) => b.failures - a.failures)
    .slice(0, limit)
    .map(s => ({ name: s._id, short: s._id.length > 26 ? `${s._id.slice(0, 25)}…` : s._id,
      failures: s.failures, total: s.total, rate: parseFloat(s.failure_rate) || 0, avg: s.avg_response_time })),
  [byStep, limit]);

  if (!rows.length) return null;
  const height = rows.length * 34 + 24;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={c.grid} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: c.text, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="short" width={180} tick={{ fill: c.text, fontSize: 12 }} axisLine={{ stroke: c.axis }} tickLine={false} />
        <Tooltip content={<Tip />} cursor={{ fill: c.grid, opacity: .6 }} isAnimationActive={false} />
        <Bar dataKey="failures" fill={c.danger} radius={[0, 4, 4, 0]} maxBarSize={20} animationDuration={600}>
          <LabelList dataKey="failures" position="right" style={{ fill: c.text, fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
