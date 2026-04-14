// src/components/TimelineChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function bucketByHour(results) {
  const map = {};
  results.forEach(r => {
    const d = new Date(r.timestamp);
    // Round down to the hour
    const key = new Date(
      d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()
    ).toISOString();

    if (!map[key]) map[key] = { time: key, failures: 0, passes: 0 };
    if (r.is_success) map[key].passes++;
    else map[key].failures++;
  });

  return Object.values(map)
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .map(d => ({
      ...d,
      label: new Date(d.time).toLocaleString('en-IN', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    }));
}

export default function TimelineChart({ results }) {
  const data = bucketByHour(results || []);

  return (
    <div style={wrapStyle}>
      <h3 style={titleStyle}>Failures over time (hourly)</h3>
      {data.length === 0 ? (
        <p style={{ color: '#999', padding: '40px', textAlign: 'center' }}>No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#666' }} />
            <YAxis tick={{ fontSize: 12, fill: '#666' }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="failures"
              stroke="#E24B4A"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="passes"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
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