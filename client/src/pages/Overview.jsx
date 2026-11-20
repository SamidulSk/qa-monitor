// src/pages/Overview.jsx
import { useMemo } from "react";
import {
  PlayCircle, CircleX, ListChecks, TriangleAlert, Percent, Timer, Activity, HeartPulse, Boxes, Flame, ArrowRight, CircleCheck, Gauge,
} from "lucide-react";
import { KpiCard } from "../components/ui/KpiCard";
import { Panel, HealthRing, RunStatus } from "../components/ui/primitives";
import { ActivityChart } from "../components/charts/ActivityChart";
import { LatencyChart } from "../components/charts/LatencyChart";
import { StatusHero } from "../components/monitoring/StatusHero";
import { IncidentFeed } from "../components/monitoring/IncidentFeed";
import { ProductGrid } from "../components/monitoring/ProductGrid";
import { FailTable } from "../components/monitoring/FailTable";
import { fmtDur, fmtTime, healthTone } from "../lib/format";
import { bucketRuns } from "../lib/buckets";

function RunHealth({ kpi, results }) {
  const total = kpi.total_runs || 0, failed = kpi.failed_runs || 0;
  const passRate = total > 0 ? ((total - failed) / total) * 100 : 100;
  const failPct = 100 - passRate;
  const latest = results[0]; // API returns runs sorted newest-first
  return (
    <Panel title="Run health" sub="Share of script runs with zero failed steps" icon={HeartPulse} bodyClass="panel-body">
      <div className="health">
        <div className="health-top">
          <HealthRing value={passRate} tone={healthTone(failPct)} size={92} stroke={8} label="PASS" />
          <div className="grow">
            <div style={{ fontSize: 13, color: "var(--text-2)" }}>
              <b className="num" style={{ color: "var(--text-0)", fontSize: 15 }}>{(total - failed).toLocaleString()}</b> of{" "}
              <b className="num" style={{ color: "var(--text-0)", fontSize: 15 }}>{total.toLocaleString()}</b> runs passed
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4 }}>
              Step failure rate <b style={{ color: `var(--${healthTone(kpi.overall_failure_rate)})` }}>{parseFloat(kpi.overall_failure_rate || 0).toFixed(1)}%</b>
            </div>
          </div>
        </div>
        <div className="health-stats">
          <div className="mini-stat"><b>{(total - failed).toLocaleString()}</b><span><CircleCheck size={12} color="var(--success)" />Passed runs</span></div>
          <div className="mini-stat"><b>{failed.toLocaleString()}</b><span><CircleX size={12} color="var(--danger)" />Failed runs</span></div>
          <div className="mini-stat"><b>{fmtDur(kpi.avg_duration || 0)}</b><span><Timer size={12} />Avg duration</span></div>
          <div className="mini-stat"><b>{(kpi.total_failures || 0).toLocaleString()}</b><span><TriangleAlert size={12} color="var(--warn)" />Step failures</span></div>
        </div>
        {latest && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>Latest run</div>
            <div className="row" style={{ justifyContent: "space-between", gap: 10 }}>
              <div className="grow">
                <div className="truncate" style={{ color: "var(--text-0)", fontWeight: 550, fontSize: 13.5 }}>{latest.project}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }} title={fmtTime(latest.timestamp)}>
                  {fmtTime(latest.timestamp)} · {latest.script_type}{latest.build_number ? ` · #${latest.build_number}` : ""}
                </div>
              </div>
              <RunStatus failed={latest.has_failure} />
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

export function Overview({ summary, results, onNavigate, onOpenRun, onSelectProduct, activeProduct, error, lastUpdated }) {
  const kpi = summary?.kpi || {};
  /* Sparklines share the activity chart's adaptive buckets (last 12) */
  const spark = useMemo(() => {
    const rows = bucketRuns(results).rows.slice(-12);
    const pick = f => rows.map(f);
    return {
      runs: pick(b => b.passed + b.failed), failedRuns: pick(b => b.failed),
      steps: pick(b => b.steps), failedSteps: pick(b => b.failedSteps),
    };
  }, [results]);
  const fr = parseFloat(kpi.overall_failure_rate) || 0;

  const cards = [
    { label: "Total script runs",   value: kpi.total_runs || 0,      tone: "accent", icon: PlayCircle,   spark: spark.runs,       sub: "All products combined" },
    { label: "Failed runs",         value: kpi.failed_runs || 0,     tone: "danger", icon: CircleX,      spark: spark.failedRuns, sub: "Runs with failures", upIsGood: false },
    { label: "Step executions",     value: kpi.total_steps_run || 0, tone: "info",   icon: ListChecks,   spark: spark.steps,      sub: "Total step checks" },
    { label: "Step failures",       value: kpi.total_failures || 0,  tone: "warn",   icon: TriangleAlert, spark: spark.failedSteps,     sub: "Individual step fails", upIsGood: false },
    { label: "Failure rate",        value: fr, dec: 1, suffix: "%",  tone: healthTone(fr), icon: Percent, sub: "Overall health", upIsGood: false },
    { label: "Avg script duration", value: kpi.avg_duration || 0, dec: 1, suffix: "s", tone: "ai", icon: Timer, sub: "Seconds per run", upIsGood: false },
  ];

  return (
    <div className="stack">
      <StatusHero results={results} error={error} lastUpdated={lastUpdated} onSelectProduct={onSelectProduct} />

      <div className="kpi-grid">
        {cards.map((c, i) => <KpiCard key={c.label} {...c} delay={i * 40} />)}
      </div>

      <div className="grid-2-1">
        <Panel title="Run activity" icon={Activity} className="fu"
          sub={`Passed vs failed runs over time · latest ${results.length} runs loaded`}
          bodyClass="panel-body">
          <ActivityChart results={results} height={250} />
        </Panel>
        <div className="fu" style={{ animationDelay: "60ms" }}><RunHealth kpi={kpi} results={results} /></div>
      </div>

      <div className="grid-2-1">
        <Panel title="Response latency" icon={Gauge} className="fu"
          sub="Step response time — average and 95th percentile"
          bodyClass="panel-body">
          <LatencyChart results={results} height={230} />
        </Panel>
        <div className="fu" style={{ animationDelay: "60ms" }}><IncidentFeed results={results} onOpenRun={onOpenRun} /></div>
      </div>

      <Panel title="Product health" sub="Live status per product" icon={Boxes} className="inset-panel fu"
        actions={<button className="btn btn-ghost btn-sm" onClick={() => onNavigate("products")}>View all <ArrowRight size={13} /></button>}>
        <div className="panel-body"><ProductGrid results={results} onSelectProduct={onSelectProduct} activeProduct={activeProduct} /></div>
      </Panel>

      <Panel title="Active failures" sub="Top 10 failing steps — sorted by impact" icon={Flame} className="fu"
        actions={<button className="btn btn-ghost btn-sm" onClick={() => onNavigate("failures")}>Failure tracker <ArrowRight size={13} /></button>}>
        <FailTable summary={summary} limit={10} />
      </Panel>
    </div>
  );
}
