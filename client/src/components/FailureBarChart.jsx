// src/components/FailureBarChart.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '13px',
    }}>
      <div style={{ fontWeight: '600', marginBottom: '6px' }}>{d._id}</div>
      <div style={{ color: '#E24B4A' }}>Failures: {d.failures}</div>
      <div style={{ color: '#1D9E75' }}>Passes: {d.passes}</div>
      <div style={{ color: '#666' }}>Failure rate: {d.failure_rate?.toFixed(1)}%</div>
      <div style={{ color: '#666' }}>Avg response: {d.avg_response_time?.toFixed(2)}s</div>
    </div>
  );
}

export default function FailureBarChart({ summary }) {
  if (!summary?.by_step?.length) return (
    <div style={wrapStyle}>
      <h3 style={titleStyle}>Failures per step</h3>
      <p style={{ color: '#999', padding: '40px', textAlign: 'center' }}>No data yet</p>
    </div>
  );

  const data = summary.by_step.slice(0, 15);

  return (
    <div style={wrapStyle}>
      <h3 style={titleStyle}>Failures per step</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="_id"
            tick={{ fontSize: 11, fill: '#666' }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fontSize: 12, fill: '#666' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="failures" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.failures === 0 ? '#1D9E75' : entry.failures > 5 ? '#E24B4A' : '#EF9F27'}
              />
            ))}
            <LabelList dataKey="failures" position="top" style={{ fontSize: 11, fill: '#444' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const wrapStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '24px',
};

const titleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  marginBottom: '16px',
  color: '#1a1a2e',
};