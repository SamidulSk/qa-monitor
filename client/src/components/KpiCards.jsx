// src/components/KpiCards.jsx

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '20px 24px',
  flex: '1',
  minWidth: '160px',
  borderTop: '4px solid',
};

function Card({ label, value, color, sub }) {
  return (
    <div style={{ ...cardStyle, borderColor: color }}>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: '32px', fontWeight: '700', color }}>
        {value ?? '—'}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function KpiCards({ summary }) {
  if (!summary) return null;

  const { kpi, by_step } = summary;

  const worstStep = by_step?.[0];
  const activeSteps = by_step?.filter(s => s.failures > 0).length ?? 0;

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
      <Card
        label="Total runs"
        value={kpi.total_runs}
        color="#378ADD"
        sub="across all steps"
      />
      <Card
        label="Total failures"
        value={kpi.total_failures}
        color="#E24B4A"
        sub="failed steps"
      />
      <Card
        label="Failure rate"
        value={`${kpi.overall_failure_rate}%`}
        color={parseFloat(kpi.overall_failure_rate) > 20 ? '#E24B4A' : '#1D9E75'}
        sub="overall"
      />
      <Card
        label="Steps with failures"
        value={activeSteps}
        color="#EF9F27"
        sub={`out of ${by_step?.length ?? 0} steps`}
      />
      <Card
        label="Worst step"
        value={worstStep?.failures ?? 0}
        color="#E24B4A"
        sub={worstStep?._id ?? 'none'}
      />
    </div>
  );
}