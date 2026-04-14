// src/App.jsx
import { useState } from 'react';
import { useResults } from './hooks/useResults';
import KpiCards       from './components/KpiCards';
import FilterBar      from './components/FilterBar';
import FailureBarChart from './components/FailureBarChart';
import TimelineChart  from './components/TimelineChart';
import ResultsTable   from './components/ResultsTable';

export default function App() {
  const [filters, setFilters] = useState({});

  const {
    results,
    summary,
    projects,
    clusters,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useResults(filters);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>
          QA Monitor Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
          Auto-refreshes every 30 seconds
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: '#FCEBEB',
          border: '1px solid #F09595',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#A32D2D',
          fontSize: '14px',
        }}>
          Could not reach API: {error}
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        projects={projects}
        clusters={clusters}
        lastUpdated={lastUpdated}
        onRefresh={refetch}
      />

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
          Loading...
        </div>
      ) : (
        <>
          <KpiCards summary={summary} />

          {/* Charts side by side on wide screens */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            <FailureBarChart summary={summary} />
            <TimelineChart results={results} />
          </div>

          <ResultsTable results={results} />
        </>
      )}
    </div>
  );
}