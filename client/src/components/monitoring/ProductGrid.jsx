// src/components/monitoring/ProductGrid.jsx
import { useMemo } from "react";
import { Boxes, Clock, Filter, Check } from "lucide-react";
import { Badge, BuildBadge, EmptyState, HealthRing } from "../ui/primitives";
import { fmtTime, healthTone, tv } from "../../lib/format";

/* Per-product aggregation — identical to the original ProductGrid */
function aggregate(results) {
  const m = {};
  results.forEach(r => {
    const k = r.project;
    if (!m[k]) m[k] = { runs: 0, failRuns: 0, steps: 0, failSteps: 0, lastRun: null, types: new Set(), hist: [] };
    const p = m[k]; p.runs++; if (r.has_failure) p.failRuns++;
    if (p.hist.length < 30) p.hist.push(r); // results arrive newest-first
    p.steps += r.total_steps || 0; p.failSteps += r.failed_steps || 0;
    p.types.add(r.script_type);
    if (!p.lastRun || new Date(r.timestamp) > new Date(p.lastRun)) { p.lastRun = r.timestamp; p.lastBuild = r.build_number; p.cluster = r.cluster; }
  });
  return Object.entries(m);
}

/* Last 30 runs, oldest → newest, as an uptime-style strip */
function RunStrip({ runs }) {
  const ordered = [...runs].reverse();
  const passed = ordered.filter(r => !r.has_failure).length;
  return (
    <div>
      <div className="strip" role="img" aria-label={`${passed} of ${ordered.length} recent runs passed`}>
        {ordered.map((r, i) => (
          <i key={r._id} className={r.has_failure ? "bad" : ""} style={{ "--i": i }}
            title={`${fmtTime(r.timestamp)} · ${r.has_failure ? `Failed (${r.failed_steps}/${r.total_steps} steps)` : "Passed"}${r.build_number ? ` · #${r.build_number}` : ""}`} />
        ))}
      </div>
      <div className="strip-meta"><span>Last {ordered.length} runs</span><span className="num">{passed}/{ordered.length} passed</span></div>
    </div>
  );
}

export function ProductGrid({ results, onSelectProduct, activeProduct }) {
  const products = useMemo(() => aggregate(results), [results]);
  if (!products.length) return (
    <EmptyState icon={Boxes} title="No product data">No script runs match the current filters.</EmptyState>
  );
  return (
    <div className="product-grid">
      {products.map(([name, d], i) => {
        const rate = d.steps > 0 ? (d.failSteps / d.steps) * 100 : 0;
        const tone = healthTone(rate);
        return (
          <article key={name} className="product spot fu" style={{ animationDelay: `${i * 45}ms`, "--tone": tv(tone) }}>
            <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <div className="grow">
                <div className="product-name">{name}</div>
                <div className="chips">
                  {d.cluster && <Badge tone="neutral">{d.cluster}</Badge>}
                  {[...d.types].map(tp => <Badge key={tp} tone="info">{tp}</Badge>)}
                </div>
              </div>
              <HealthRing value={100 - Math.min(rate, 100)} tone={tone} size={62} />
            </div>
            <RunStrip runs={d.hist} />
            <div className="product-stats">
              {[
                { l: "Runs",       v: d.runs,      c: "text-0" },
                { l: "Failed",     v: d.failRuns,  c: d.failRuns > 0 ? "danger" : "text-3" },
                { l: "Step fails", v: d.failSteps, c: d.failSteps > 0 ? "warn" : "text-3" },
              ].map(x => (
                <div key={x.l} className="mini-stat">
                  <b style={{ color: tv(x.c) }}>{x.v}</b>
                  <span>{x.l}</span>
                </div>
              ))}
            </div>
            <div className="product-foot">
              <span className="row" style={{ gap: 6 }}><Clock size={13} />{d.lastRun ? fmtTime(d.lastRun) : "—"}</span>
              <span className="row" style={{ gap: 6 }}>
                {d.lastBuild && <BuildBadge build={d.lastBuild} />}
                {onSelectProduct && (
                  activeProduct === name
                    ? <Badge tone="info" icon={Check}>Filtered</Badge>
                    : <button className="btn btn-ghost btn-sm" style={{ height: 24, padding: "0 8px" }}
                        onClick={() => onSelectProduct(name)} title={`Filter the dashboard to ${name}`}>
                        <Filter size={12} /> Filter
                      </button>
                )}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
