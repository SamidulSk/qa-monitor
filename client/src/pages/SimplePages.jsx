// src/pages/SimplePages.jsx
// Failure Tracker · Products · Step Analytics · Build Tracker
import { useMemo, useState } from "react";
import { TriangleAlert, ListTree, BarChart3, GitCommitHorizontal, Clock, CircleCheck, CircleAlert, Search, Download } from "lucide-react";
import { downloadCSV } from "../lib/csv";
import { Panel, Badge, EmptyState, Meter, SearchField } from "../components/ui/primitives";
import { FailTable } from "../components/monitoring/FailTable";
import { ProductGrid } from "../components/monitoring/ProductGrid";
import { TopFailuresChart } from "../components/charts/TopFailuresChart";
import { fmtPct, fmtTime, healthTone, severity, tv } from "../lib/format";

/* ─── Failure Tracker ───────────────────────────────────────── */
export function FailuresPage({ summary }) {
  const failing = summary?.by_step?.filter(s => s.failures > 0) || [];
  return (
    <div className="stack">
      {failing.length > 0 && (
        <Panel title="Most failing steps" sub="Top steps by failure count — hover a bar for details" icon={BarChart3} className="fu" bodyClass="panel-body">
          <TopFailuresChart byStep={summary?.by_step} />
        </Panel>
      )}
      <Panel title="All failure events" sub={`${failing.length} steps with recorded failures · click a column to sort`} icon={TriangleAlert} className="fu"
        actions={failing.length > 0 && (
          <button className="btn btn-sm" onClick={() => downloadCSV("qa-failures", [...failing].sort((a, b) => b.failures - a.failures), [
            { label: "Step", get: s => s._id },
            { label: "Failures", get: s => s.failures },
            { label: "Runs", get: s => s.total },
            { label: "Failure rate %", get: s => (parseFloat(s.failure_rate) || 0).toFixed(2) },
            { label: "Avg response (s)", get: s => s.avg_response_time?.toFixed(3) },
            { label: "Last seen", get: s => (s.last_run ? new Date(s.last_run).toISOString() : "") },
          ])}><Download size={13} /> Export CSV</button>
        )}>
        <FailTable summary={summary} />
      </Panel>
    </div>
  );
}

/* ─── Products ──────────────────────────────────────────────── */
export function ProductsPage({ results, onSelectProduct, activeProduct }) {
  return <div className="fu"><ProductGrid results={results} onSelectProduct={onSelectProduct} activeProduct={activeProduct} /></div>;
}

/* ─── Step Analytics ────────────────────────────────────────── */
const SEV_LABEL = { success: "OK", warn: "Warn", danger: "Fail" };
const SEV_ICON  = { success: CircleCheck, warn: TriangleAlert, danger: CircleAlert };

export function StepsPage({ summary }) {
  const [q, setQ] = useState("");
  const all = useMemo(() => [...(summary?.by_step || [])].sort((a, b) => (b.failures || 0) - (a.failures || 0)), [summary]);
  const steps = q ? all.filter(s => s._id?.toLowerCase().includes(q.toLowerCase())) : all;
  const hasFailures = all.some(s => s.failures > 0);

  if (!all.length) return (
    <Panel><EmptyState icon={ListTree} title="No step data available">Step-level metrics appear once script runs are recorded.</EmptyState></Panel>
  );

  return (
    <div className="stack">
      {hasFailures && (
        <Panel title="Failure hotspots" sub="Steps ranked by failure count" icon={BarChart3} className="fu" bodyClass="panel-body">
          <TopFailuresChart byStep={all} limit={10} />
        </Panel>
      )}
      <Panel title="Step-level analytics" sub={`${all.length} steps · sorted by failure count`} icon={ListTree} className="fu"
        actions={<SearchField value={q} onChange={setQ} placeholder="Filter steps…" />}>
        {steps.length === 0 ? (
          <EmptyState icon={Search} title="No matching steps">Try a different search term.</EmptyState>
        ) : steps.map((s, i) => {
          const rate = parseFloat(s.failure_rate) || 0;
          const sev = severity(rate);
          const Icon = SEV_ICON[sev];
          return (
            <div key={s._id} className="step-row fu" style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }}>
              <div style={{ minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 13.5, fontWeight: 550, color: "var(--text-0)" }} title={s._id}>{s._id}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Clock size={11} /> Last: {s.last_run ? fmtTime(s.last_run) : "—"}
                </div>
              </div>
              <div className="step-num"><b>{s.total}</b><span>Total</span></div>
              <div className="step-num"><b style={{ color: s.failures > 0 ? "var(--danger)" : "var(--text-3)" }}>{s.failures}</b><span>Failures</span></div>
              <div className="step-num"><b className="mono" style={{ fontSize: 14 }}>{s.avg_response_time?.toFixed(2)}s</b><span>Avg time</span></div>
              <div className="row step-rate" style={{ gap: 10 }}>
                <Meter value={rate} tone={healthTone(rate)} />
                <span className="mono" style={{ fontSize: 12, color: tv(healthTone(rate)), fontWeight: 600, minWidth: 46, textAlign: "right" }}>{fmtPct(rate)}</span>
                <Badge tone={sev} icon={Icon}>{SEV_LABEL[sev]}</Badge>
              </div>
            </div>
          );
        })}
      </Panel>
    </div>
  );
}

/* ─── Build Tracker ─────────────────────────────────────────── */
/* Aggregation identical to the original BuildTracker */
function aggregateBuilds(results) {
  const builds = {};
  results.forEach(r => {
    const b = r.build_number || "Unknown";
    if (!builds[b]) builds[b] = { runs: 0, fails: 0, projects: new Set(), failedSteps: [], firstSeen: r.timestamp, lastSeen: r.timestamp };
    builds[b].runs++;
    if (r.has_failure) { builds[b].fails++; r.steps?.filter(s => !s.is_success).forEach(s => builds[b].failedSteps.push({ step: s.step, project: r.project })); }
    builds[b].projects.add(r.project);
    if (new Date(r.timestamp) > new Date(builds[b].lastSeen)) builds[b].lastSeen = r.timestamp;
  });
  return Object.entries(builds).sort((a, b) => new Date(b[1].lastSeen) - new Date(a[1].lastSeen));
}

export function BuildsPage({ results }) {
  const builds = useMemo(() => aggregateBuilds(results), [results]);
  if (!builds.length) return (
    <Panel><EmptyState icon={GitCommitHorizontal} title="No builds recorded">Runs with a build number will appear here.</EmptyState></Panel>
  );
  return (
    <div className="stack" style={{ gap: 12 }}>
      {builds.map(([build, d], i) => {
        const clean = d.fails === 0;
        const unique = [...new Map(d.failedSteps.map(s => [s.step + s.project, s])).values()];
        return (
          <section key={build} className="panel build-card fu accent-left"
            style={{ animationDelay: `${Math.min(i, 15) * 35}ms`, "--tone": clean ? "var(--success)" : "var(--danger)" }}>
            <div className="build-row">
              <div style={{ minWidth: 120 }}>
                <div className="build-label">Build</div>
                <div className="build-num">#{build}</div>
              </div>
              <div className="grow" style={{ minWidth: 180 }}>
                <div className="chips" style={{ marginBottom: 6 }}>{[...d.projects].map(p => <Badge key={p} tone="info">{p}</Badge>)}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} /> {fmtTime(d.firstSeen)} → {fmtTime(d.lastSeen)}
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <div className="mini-stat" style={{ minWidth: 76 }}><b>{d.runs}</b><span>Runs</span></div>
                <div className="mini-stat" style={{ minWidth: 76 }}><b style={{ color: clean ? "var(--text-3)" : "var(--danger)" }}>{d.fails}</b><span>Failed</span></div>
              </div>
              {clean
                ? <Badge tone="success" icon={CircleCheck}>Clean build</Badge>
                : <Badge tone="danger" icon={CircleAlert}>{d.failedSteps.length} failure{d.failedSteps.length > 1 ? "s" : ""}</Badge>}
            </div>
            {d.failedSteps.length > 0 && (
              <div className="build-fails">
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Failed steps in this build</div>
                <div className="chips" style={{ gap: 6 }}>
                  {unique.map((s, si) => (
                    <span key={si} className="fail-chip"><em>{s.project} /</em>{s.step}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

