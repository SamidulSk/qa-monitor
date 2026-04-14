// src/hooks/useResults.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const POLL_INTERVAL = 30000; // 30 seconds

export function useResults(filters) {
  const [results, setResults]     = useState([]);
  const [summary, setSummary]     = useState(null);
  const [projects, setProjects]   = useState([]);
  const [clusters, setClusters]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Build query string from active filters
  const buildQuery = useCallback((extra = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...extra };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return params.toString();
  }, [filters]);

  const fetchAll = useCallback(async () => {
    try {
      setError(null);

      const qs       = buildQuery({ limit: 100 });
      const summaryQs = buildQuery();

      const [resultsRes, summaryRes] = await Promise.all([
        axios.get(`${API}/api/results?${qs}`),
        axios.get(`${API}/api/results/summary?${summaryQs}`),
      ]);

      setResults(resultsRes.data.results);
      setSummary(summaryRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  // Fetch project + cluster lists once on mount
  useEffect(() => {
    axios.get(`${API}/api/results/projects`)
      .then(res => {
        setProjects(res.data.projects || []);
        setClusters(res.data.clusters || []);
      })
      .catch(() => {});
  }, []);

  // Fetch data immediately and then every 30 seconds
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return {
    results,
    summary,
    projects,
    clusters,
    loading,
    error,
    lastUpdated,
    refetch: fetchAll,
  };
}