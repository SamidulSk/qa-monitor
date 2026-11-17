// src/hooks/useDashboardData.js
// Data fetching + polling — logic preserved 1:1 from the original App.jsx.
import { useState, useEffect, useCallback } from "react";
import { API_BASE, TOKEN, POLL_MS, apiFetch } from "../lib/api";

export function useDashboardData(filters) {
  const [data, setData]               = useState({ results: [], summary: null, projects: [], clusters: [] });
  const [loading, setLoading]         = useState(true);
  const [waking, setWaking]           = useState(false);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const buildQS = useCallback((extra = {}) => {
    const p = new URLSearchParams();
    const SKIP = new Set(["_preset"]); // UI-only keys — never sent to API
    Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
      if (v && !SKIP.has(k)) p.set(k, v);
    });
    return p.toString();
  }, [filters]);

  const fetchData = useCallback(async (isWake = false) => {
    try {
      setError(null); if (isWake) setWaking(true);
      const h = { Authorization: `Bearer ${TOKEN}` };
      const [rR, sR, pR] = await Promise.all([
        apiFetch(`${API_BASE}/api/results?${buildQS({ limit: 200 })}`, { headers: h }),
        apiFetch(`${API_BASE}/api/results/summary?${buildQS()}`, { headers: h }),
        apiFetch(`${API_BASE}/api/results/projects`, { headers: h }),
      ]);
      const [rD, sD, pD] = await Promise.all([rR.json(), sR.json(), pR.json()]);
      setData({ results: rD.results || [], summary: sD, projects: pD.projects || [], clusters: pD.clusters || [] });
      setLastUpdated(new Date());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); setWaking(false); }
  }, [buildQS]);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, POLL_MS);
    return () => clearInterval(iv);
  }, [fetchData]);

  return { data, loading, waking, error, lastUpdated, fetchData };
}
