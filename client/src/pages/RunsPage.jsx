// src/pages/RunsPage.jsx
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronRight, History, Search, Download } from "lucide-react";
import { downloadCSV } from "../lib/csv";
import { Panel, Badge, BuildBadge, EmptyState, Paginator, RunStatus, SearchField, Segmented, StepsTally } from "../components/ui/primitives";
import { StepTrace } from "../components/monitoring/StepTrace";
import { fmtDur, fmtTime } from "../lib/format";

const PER = 15;

export function RunsPage({ results, focusRunId }) {
  /* When opened from an incident, start with that run expanded on its page */
  const [exp, setExp]       = useState(() => focusRunId || null);
  const [page, setPage]     = useState(() => {
    const i = focusRunId ? results.findIndex(r => r._id === focusRunId) : -1;
    return i >= 0 ? Math.floor(i / PER) + 1 : 1;
  });
  const [q, setQ]           = useState("");
  const [show, setShow]     = useState("all");

  useEffect(() => {
    if (!focusRunId) return;
    const id = setTimeout(() => document.getElementById(`run-${focusRunId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    return () => clearTimeout(id);
  }, [focusRunId]);

  const counts = useMemo(() => ({
    all: results.length,
    failed: results.filter(r => r.has_failure).length,
    passed: results.filter(r => !r.has_failure).length,
  }), [results]);

  /* Client-side refinement of the already-fetched run list */
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return results.filter(r => {
      if (show === "failed" && !r.has_failure) return false;
      if (show === "passed" && r.has_failure) return false;
      if (!s) return true;
      return r.project?.toLowerCase().includes(s) || r.cluster?.toLowerCase().includes(s) ||
             String(r.build_number || "").toLowerCase().includes(s) ||
             r.steps?.some(st => st.step?.toLowerCase().includes(s));
    });
  }, [results, q, show]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const cur = Math.min(page, pages);
  const visible = filtered.slice((cur - 1) * PER, cur * PER);

  return (
    <Panel title="Execution log" sub={`${results.length} total runs · click any row to expand its step trace`} icon={History} className="fu"
      actions={
        <div className="toolbar">
          <Segmented ariaLabel="Run result" value={show} onChange={v => { setShow(v); setPage(1); }} options={[
            { id: "all", label: "All", count: counts.all },
            { id: "failed", label: "Failed", count: counts.failed },
            { id: "passed", label: "Passed", count: counts.passed },
          ]} />
          <SearchField value={q} onChange={v => { setQ(v); setPage(1); }} placeholder="Search product, build, cluster, step…" />
          <button className="btn btn-sm" disabled={!filtered.length} title="Download the runs shown (all pages) as CSV"
            onClick={() => downloadCSV("qa-runs", filtered, [
              { label: "Timestamp", get: r => r.timestamp },
              { label: "Product", get: r => r.project },
              { label: "Cluster", get: r => r.cluster },
              { label: "Script", get: r => r.script_type },
              { label: "Build", get: r => r.build_number },
              { label: "Passed steps", get: r => r.passed_steps },
              { label: "Failed steps", get: r => r.failed_steps },
              { label: "Total steps", get: r => r.total_steps },
              { label: "Duration (s)", get: r => r.total_duration },
              { label: "Result", get: r => (r.has_failure ? "Failed" : "Passed") },
              { label: "Failed step names", get: r => (r.steps || []).filter(s => !s.is_success).map(s => s.step).join(" | ") },
            ])}>
            <Download size={13} /> CSV
          </button>
        </div>
      }>
      {filtered.length === 0 ? (
        results.length === 0
          ? <EmptyState icon={History} title="No runs recorded">Runs posted to the API will appear here.</EmptyState>
          : <EmptyState icon={Search} title="No runs match">Try a different search or result filter.</EmptyState>
      ) : (
        <div className="table-wrap">
          <table className="dt">
            <thead>
              <tr>
                <th className="chev-cell" />
                <th>Timestamp</th><th>Product</th><th className="hide-mobile">Cluster</th><th>Script</th>
                <th>Build</th><th>Steps</th><th className="hide-mobile">Duration</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const open = exp === r._id;
                return (
                  <Fragment key={r._id}>
                    <tr id={`run-${r._id}`} className={`hoverable clickable${open ? " expanded" : ""}`} onClick={() => setExp(open ? null : r._id)} aria-expanded={open}>
                      <td className="chev-cell"><ChevronRight size={15} className={`chev-rot${open ? " open" : ""}`} /></td>
                      <td className="mono nowrap muted">{fmtTime(r.timestamp)}</td>
                      <td className="strong">{r.project}</td>
                      <td className="hide-mobile"><Badge tone="neutral">{r.cluster}</Badge></td>
                      <td><Badge tone="info">{r.script_type}</Badge></td>
                      <td><BuildBadge build={r.build_number} /></td>
                      <td><StepsTally passed={r.passed_steps} failed={r.failed_steps} total={r.total_steps} /></td>
                      <td className="hide-mobile mono muted">{fmtDur(r.total_duration)}</td>
                      <td><RunStatus failed={r.has_failure} /></td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={9} className="expand-cell"><StepTrace steps={r.steps || []} /></td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Paginator page={cur} pages={pages} setPage={setPage} total={filtered.length} per={PER} />
    </Panel>
  );
}
