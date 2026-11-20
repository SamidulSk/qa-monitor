// src/components/layout/Topbar.jsx
import { useEffect, useState } from "react";
import {
  Menu, RefreshCw, Sun, Moon, Search, Package, Server, Timer, Activity, CalendarRange, X, ChevronRight,
  Bell, BellOff, Tv,
} from "lucide-react";
import { POLL_MS } from "../../lib/api";
import { SelectField, Segmented } from "../ui/primitives";
import { TIME_PRESETS, presetToFromTo } from "../../lib/constants";
import { fmtTime, relTime } from "../../lib/format";

/* Re-renders every few seconds so "updated Xs ago" stays fresh */
function useNow(ms = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(iv); }, [ms]);
  return now;
}

function LiveStatus({ lastUpdated, error, busy }) {
  const now = useNow(1000);
  const state = error ? "err" : busy ? "sync" : "";
  const label = error ? "Connection issue" : busy ? "Syncing…" : lastUpdated ? `Updated ${relTime(lastUpdated, now)}` : "Connecting…";
  /* Approximate time to the next 30 s poll, measured from the last successful update */
  const left = lastUpdated ? Math.max(0, POLL_MS - (now - new Date(lastUpdated).getTime())) : POLL_MS;
  const C = 2 * Math.PI * 6;
  return (
    <span className={`status-chip ${state} hide-mobile`}
      title={lastUpdated ? `Last updated ${fmtTime(lastUpdated)} · next auto-refresh in ~${Math.ceil(left / 1000)}s` : undefined}>
      <svg className="cd-ring" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <circle className="track" cx="8" cy="8" r="6" />
        <circle className="prog" cx="8" cy="8" r="6" strokeDasharray={C} strokeDashoffset={C * (1 - left / POLL_MS)} />
      </svg>
      {label}
      {lastUpdated && <span key={String(lastUpdated)} className="chip-flash" aria-hidden="true" />}
    </span>
  );
}

export function Topbar({ title, lastUpdated, busy, error, onRefresh, filters, setFilters, projects, clusters,
                         isDark, toggleTheme, onMenu, onCommand, notify, onToggleNotify, onTv }) {
  /* Filter-state semantics preserved from the original Topbar */
  const activePreset = filters._preset || null;
  const showCustom   = activePreset === "custom" || (!activePreset && (filters.from || filters.to));
  const hasFilter    = Object.entries(filters).some(([k, v]) => v && k !== "_preset");
  const activeCount  = ["project", "cluster", "script_type", "status", "from", "to"].filter(k => filters[k]).length;

  const applyPreset = (id) => {
    if (id === "custom") {
      setFilters(f => ({ ...f, _preset: "custom", from: "", to: "" }));
      return;
    }
    const { from, to } = presetToFromTo(id);
    setFilters(f => ({ ...f, _preset: id, from, to }));
  };
  const setKey = key => v => setFilters(f => ({ ...f, [key]: v }));

  return (
    <header className="topbar">
      <div className="topbar-row">
        <button className="btn btn-ghost btn-icon mobile-only" onClick={onMenu} aria-label="Open menu"><Menu size={18} /></button>
        <nav className="crumbs grow" aria-label="Breadcrumb">
          <span className="hide-mobile">QA Monitor</span>
          <ChevronRight size={14} className="hide-mobile" />
          <b>{title}</b>
        </nav>

        <button className="btn btn-ghost hide-mobile" onClick={onCommand} style={{ color: "var(--text-3)", gap: 10 }} title="Command menu">
          <Search size={14} /> Jump to… <span className="kbd">Ctrl K</span>
        </button>
        <LiveStatus lastUpdated={lastUpdated} error={error} busy={busy} />
        <button className={`btn btn-ghost btn-icon${notify ? " on" : ""}`} onClick={onToggleNotify}
          title={notify ? "Failure alerts on — click to turn off" : "Get alerted when new failures arrive"} aria-label="Toggle failure alerts" aria-pressed={notify}>
          {notify ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
        <button className="btn btn-ghost btn-icon hide-mobile" onClick={onTv} title="TV mode — fullscreen wall display" aria-label="TV mode">
          <Tv size={16} />
        </button>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
          <span key={String(isDark)} className="theme-icon">{isDark ? <Sun size={16} /> : <Moon size={16} />}</span>
        </button>
        <button className="btn btn-primary" onClick={onRefresh} title="Refresh data now">
          <RefreshCw size={14} className={busy ? "spin" : undefined} aria-hidden="true" />
          <span className="hide-mobile">Refresh</span>
        </button>
      </div>

      <div className="topbar-filters">
        <SelectField icon={Package}  value={filters.project}     onChange={setKey("project")}     placeholder="All products" ariaLabel="Product"
          options={projects.map(p => ({ v: p, l: p }))} />
        <SelectField icon={Server}   value={filters.cluster}     onChange={setKey("cluster")}     placeholder="All clusters" ariaLabel="Cluster"
          options={clusters.map(c => ({ v: c, l: c }))} />
        <SelectField icon={Timer}    value={filters.script_type} onChange={setKey("script_type")} placeholder="All scripts" ariaLabel="Script"
          options={[{ v: "5min", l: "5 min" }, { v: "30min", l: "30 min" }]} />
        <SelectField icon={Activity} value={filters.status}      onChange={setKey("status")}      placeholder="Any status" ariaLabel="Status"
          options={[{ v: "failed", l: "Failed" }, { v: "passed", l: "Passed" }]} />

        <span className="vdiv hide-mobile" />

        <Segmented ariaLabel="Time range" onChange={applyPreset}
          value={showCustom ? "custom" : activePreset}
          options={[...TIME_PRESETS, { id: "custom", label: "Custom", icon: CalendarRange }]} />

        {showCustom && (
          <div className="row fi">
            <label className="field active">
              <input type="date" value={filters.from || ""} aria-label="From date"
                onChange={e => setFilters(f => ({ ...f, from: e.target.value, _preset: "custom" }))} />
            </label>
            <span style={{ color: "var(--text-3)", fontSize: 12 }}>→</span>
            <label className="field active">
              <input type="date" value={filters.to || ""} aria-label="To date"
                onChange={e => setFilters(f => ({ ...f, to: e.target.value, _preset: "custom" }))} />
            </label>
          </div>
        )}

        {hasFilter && (
          <button className="btn btn-ghost btn-sm fi" onClick={() => setFilters({})} style={{ color: "var(--danger)" }}>
            <X size={13} /> Clear{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        )}
      </div>
      {busy && <div className="progress-line" />}
    </header>
  );
}
