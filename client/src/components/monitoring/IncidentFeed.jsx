// src/components/monitoring/IncidentFeed.jsx
import { useEffect, useMemo, useState } from "react";
import { Siren, ShieldCheck, ChevronRight } from "lucide-react";
import { Panel, EmptyState, BuildBadge } from "../ui/primitives";
import { recentIncidents } from "../../lib/insights";
import { fmtTime, relTime } from "../../lib/format";

function useNow(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const iv = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(iv); }, [ms]);
  return now;
}

export function IncidentFeed({ results, onOpenRun }) {
  const incidents = useMemo(() => recentIncidents(results, 6), [results]);
  const now = useNow();
  return (
    <Panel title="Recent incidents" sub="Latest failed runs — click to inspect" icon={Siren} style={{ height: "100%" }}>
      {incidents.length === 0 ? (
        <EmptyState icon={ShieldCheck} tone="success" title="No incidents">No failed runs in the loaded window.</EmptyState>
      ) : (
        <ul className="incidents">
          {incidents.map(({ run, failedSteps }) => (
            <li key={run._id}>
              <button className="incident" onClick={() => onOpenRun?.(run._id)}>
                <span className="incident-rail"><i /></span>
                <span className="grow" style={{ minWidth: 0 }}>
                  <span className="incident-top">
                    <b className="truncate">{run.project}</b>
                    <span className="incident-time" title={fmtTime(run.timestamp)}>{relTime(run.timestamp, now)}</span>
                  </span>
                  <span className="incident-steps truncate" title={failedSteps.join("\n")}>
                    {failedSteps.slice(0, 2).join(" · ")}{failedSteps.length > 2 ? ` +${failedSteps.length - 2}` : ""}
                  </span>
                  <span className="incident-meta">
                    <span className="mono">{run.failed_steps}/{run.total_steps} failed</span>
                    {run.build_number && <BuildBadge build={run.build_number} />}
                  </span>
                </span>
                <ChevronRight size={15} className="incident-chev" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
