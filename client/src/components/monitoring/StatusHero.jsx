// src/components/monitoring/StatusHero.jsx
// Status-page style headline: is everything green on the latest run of each product?
import { useMemo } from "react";
import { CircleCheck, TriangleAlert, CloudOff } from "lucide-react";
import { productStatus } from "../../lib/insights";
import { fmtTime } from "../../lib/format";

export function StatusHero({ results, error, lastUpdated, onSelectProduct }) {
  const products = useMemo(() => productStatus(results), [results]);
  const failing = products.filter(p => p.failing);

  const state = error ? "down" : failing.length ? "degraded" : "ok";
  const Icon = state === "ok" ? CircleCheck : state === "down" ? CloudOff : TriangleAlert;
  const title = state === "ok"
    ? "All systems operational"
    : state === "down"
      ? "Monitoring API unreachable"
      : `${failing.length} of ${products.length} product${products.length > 1 ? "s" : ""} failing on latest run`;
  const sub = state === "ok"
    ? `Latest run of every product passed · ${products.length} products monitored`
    : state === "down"
      ? "Showing the last data received. Retrying automatically."
      : failing.map(p => p.name).join(" · ");

  return (
    <section className={`hero hero-${state} fu`}>
      <div className="hero-main">
        <div className="hero-orb"><Icon size={20} strokeWidth={2.4} /></div>
        <div className="grow">
          <h2>{title}</h2>
          <p className="truncate" title={sub}>{sub}</p>
        </div>
        {lastUpdated && <span className="hero-time hide-mobile">Checked {fmtTime(lastUpdated)}</span>}
      </div>
      {products.length > 0 && (
        <div className="hero-products">
          {products.map(p => (
            <button key={p.name} className={`hero-pill${p.failing ? " bad" : ""}`} onClick={() => onSelectProduct?.(p.name)}
              title={`${p.name}: latest run ${p.failing ? "failed" : "passed"} · ${p.passRate.toFixed(0)}% of loaded runs passed — click to filter`}>
              <i className="dot" />
              <span className="truncate">{p.name}</span>
              <span className="hero-pill-rate num">{p.passRate.toFixed(0)}%</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
