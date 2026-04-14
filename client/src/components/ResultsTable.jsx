// src/components/ResultsTable.jsx
import { useState } from 'react';

const COLS = [
  { key: 'timestamp',     label: 'Time' },
  { key: 'project',       label: 'Project' },
  { key: 'cluster',       label: 'Cluster' },
  { key: 'script_type',   label: 'Script' },
  { key: 'step',          label: 'Step' },
  { key: 'status_code',   label: 'Status' },
  { key: 'response_time', label: 'Response (s)' },
  { key: 'is_success',    label: 'Result' },
];

function Badge({ success }) {
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      background: success ? '#EAF3DE' : '#FCEBEB',
      color: success ? '#3B6D11' : '#A32D2D',
    }}>
      {success ? 'PASS' : 'FAIL'}
    </span>
  );
}

export default function ResultsTable({ results }) {
  const [sortKey, setSortKey]   = useState('timestamp');
  const [sortDir, setSortDir]   = useState('desc');
  const [page, setPage]         = useState(1);
  const perPage = 20;

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  }

  const sorted = [...(results || [])].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'timestamp') { av = new Date(av); bv = new Date(bv); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const visible = sorted.slice((page - 1) * perPage, page * perPage);

  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>
          All results
        </h3>
        <span style={{ fontSize: '13px', color: '#999' }}>
          {results?.length ?? 0} records
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              {COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    color: '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLS.length} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No results found
                </td>
              </tr>
            )}
            {visible.map((r, i) => (
              <tr
                key={r._id}
                style={{
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <td style={tdStyle}>
                  {new Date(r.timestamp).toLocaleString('en-IN')}
                </td>
                <td style={tdStyle}>{r.project}</td>
                <td style={tdStyle}>{r.cluster}</td>
                <td style={tdStyle}>{r.script_type}</td>
                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.step}
                </td>
                <td style={{ ...tdStyle, fontWeight: '600', color: r.status_code?.startsWith('2') ? '#1D9E75' : '#E24B4A' }}>
                  {r.status_code}
                </td>
                <td style={tdStyle}>{r.response_time?.toFixed(2)}</td>
                <td style={tdStyle}><Badge success={r.is_success} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnStyle}>
            Prev
          </button>
          <span style={{ padding: '6px 12px', fontSize: '13px', color: '#666' }}>
            {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={btnStyle}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const tdStyle = { padding: '10px 12px', color: '#1a1a2e' };
const btnStyle = {
  padding: '6px 16px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: '#f4f6f9',
  fontSize: '13px',
  cursor: 'pointer',
};