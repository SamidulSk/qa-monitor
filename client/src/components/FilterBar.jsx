// src/components/FilterBar.jsx

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: '#fff',
  fontSize: '14px',
  color: '#1a1a2e',
  minWidth: '160px',
};

const inputStyle = {
  ...selectStyle,
  minWidth: '180px',
};

export default function FilterBar({ filters, onChange, projects, clusters, lastUpdated, onRefresh }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>

      <select
        style={selectStyle}
        value={filters.project || ''}
        onChange={e => onChange({ ...filters, project: e.target.value })}
      >
        <option value="">All projects</option>
        {projects.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <select
        style={selectStyle}
        value={filters.cluster || ''}
        onChange={e => onChange({ ...filters, cluster: e.target.value })}
      >
        <option value="">All clusters</option>
        {clusters.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        style={selectStyle}
        value={filters.script_type || ''}
        onChange={e => onChange({ ...filters, script_type: e.target.value })}
      >
        <option value="">All scripts</option>
        <option value="5min">5 min scripts</option>
        <option value="30min">30 min scripts</option>
        <option value="other">Other</option>
      </select>

      <select
        style={selectStyle}
        value={filters.status || ''}
        onChange={e => onChange({ ...filters, status: e.target.value })}
      >
        <option value="">All statuses</option>
        <option value="failed">Failures only</option>
        <option value="passed">Passed only</option>
      </select>

      <input
        type="date"
        style={inputStyle}
        value={filters.from || ''}
        onChange={e => onChange({ ...filters, from: e.target.value })}
      />
      <input
        type="date"
        style={inputStyle}
        value={filters.to || ''}
        onChange={e => onChange({ ...filters, to: e.target.value })}
      />

      <button
        onClick={() => onChange({})}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          background: '#f4f6f9',
          fontSize: '14px',
        }}
      >
        Clear
      </button>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {lastUpdated && (
          <span style={{ fontSize: '12px', color: '#999' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={onRefresh}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: '#378ADD',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}