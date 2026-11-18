// src/pages/ArcAIPage.jsx
// ARC AI monitor. Detection, KPI maths, SWW audio-alert behaviour, tab/search/
// pagination semantics are all preserved from the original implementation.
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, CircleX, ListChecks, TriangleAlert, Percent, Ban, ChevronRight, History, FileWarning, Siren, Loader, ShieldCheck, Search, ArrowRight, Download,
} from "lucide-react";
import { KpiCard } from "../components/ui/KpiCard";
import { Panel, Badge, BuildBadge, EmptyState, Paginator, RunStatus, SearchField, Segmented, StepsTally } from "../components/ui/primitives";
import { StepTrace } from "../components/monitoring/StepTrace";
import { isSWW, isArcAIRun } from "../lib/arcai";
import { fmtDur, fmtTime, healthTone } from "../lib/format";
import { downloadCSV } from "../lib/csv";

const PER = 15;
const ALERT_CHIME = "/alert.mp3";        // attention chime
const ALERT_VOICE = "/alert-voice.wav";  // male voice: "Attention. ARC AI alert. Something went wrong. The AI did not respond."

export function ArcAIPage({ results }) {
  const [expanded, setExpanded] = useState(null);
  const [tab,      setTab]      = useState("runs");
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");

  /* ── Filter ARC AI runs from shared results (no separate fetch) ── */
  const aiRuns = useMemo(() => (results || []).filter(isArcAIRun), [results]);

  /* ── Flatten error/fail steps for Error Log tab ── */
  const errorSteps = useMemo(() => {
    const list = [];
    aiRuns.forEach(r => {
      (r.steps || []).forEach(s => {
        if (!s.is_success || s.error_msg || s.response_body) {
          list.push({
            project:   r.project,
            build:     r.build_number,
            cluster:   r.cluster,
            run_ts:    r.timestamp,
            step:      s.step,
            status:    s.status_code,
            success:   s.is_success,
            resp_time: s.response_time,
            error_msg: s.error_msg     || "",
            resp_body: s.response_body || "",
            sww:       isSWW(s),
          });
        }
      });
    });
    return list.sort((a, b) => new Date(b.run_ts) - new Date(a.run_ts));
  }, [aiRuns]);

  /* ── KPIs ── */
  const totalRuns   = aiRuns.length;
  const failedRuns  = aiRuns.filter(r => r.has_failure).length;
  const totalSteps  = aiRuns.reduce((s, r) => s + (r.total_steps  || 0), 0);
  const totalFailed = aiRuns.reduce((s, r) => s + (r.failed_steps || 0), 0);
  const failRate    = totalSteps > 0 ? ((totalFailed / totalSteps) * 100).toFixed(1) : "0.0";
  const swwCount = useMemo(() =>
    aiRuns.reduce((acc, r) => acc + (r.steps || []).filter(s => isSWW(s)).length, 0), [aiRuns]);

  /* ── SWW Audio Alert ───────────────────────────────────────────
     Fires only when the SWW count rises (not on first render), and
     re-arms once the count drops back to 0 — trigger logic unchanged.
     Sound: chime (ALERT_CHIME) followed by a spoken male-voice
     announcement (ALERT_VOICE). Swap either file in /public to change it. */
  const prevSwwRef   = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (prevSwwRef.current === null) {
      prevSwwRef.current = swwCount;
      return;
    }
    if (swwCount > prevSwwRef.current && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      try {
        const chime = new Audio(ALERT_CHIME);
        const voice = new Audio(ALERT_VOICE);
        chime.volume = 0.85;
        voice.volume = 1;
        const speak = () => voice.play().catch(() => { /* autoplay blocked — banner still shows */ });
        chime.onended = speak;
        chime.play().catch(speak); // if the chime can't play, still try the voice
      } catch { /* ignore construction errors */ }
    }
    if (swwCount === 0) {
      hasPlayedRef.current = false;
    }
    prevSwwRef.current = swwCount;
  }, [swwCount]);

  /* ── Filtered list per tab ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (tab === "runs") {
      return q
        ? aiRuns.filter(r =>
            r.project?.toLowerCase().includes(q) ||
            r.build_number?.includes(q) ||
            r.cluster?.toLowerCase().includes(q))
        : aiRuns;
    } else if (tab === "errors") {
      return q
        ? errorSteps.filter(e =>
            e.step?.toLowerCase().includes(q) ||
            e.error_msg?.toLowerCase().includes(q) ||
            e.project?.toLowerCase().includes(q))
        : errorSteps;
    } else {
      const swwSteps = errorSteps.filter(e => e.sww);
      return q
        ? swwSteps.filter(e => e.step?.toLowerCase().includes(q) || e.project?.toLowerCase().includes(q))
        : swwSteps;
    }
  }, [tab, aiRuns, errorSteps, search]);

  const totalPages = Math.ceil(filtered.length / PER);
  const visible    = filtered.slice((page - 1) * PER, page * PER);
  const switchTab  = (t) => { setTab(t); setPage(1); setSearch(""); setExpanded(null); };

  /* ── Empty / loading state ── */
  if (totalRuns === 0) {
    const mainStillLoading = !results || results.length === 0;
    return mainStillLoading ? (
      <Panel><EmptyState icon={Loader} tone="ai" title="Loading ARC AI data…">Waiting for script runs from the API.</EmptyState></Panel>
    ) : (
      <Panel className="fu">
        <EmptyState icon={Sparkles} tone="ai" title="No ARC AI runs yet">
          Push data using the same API endpoint with <code className="inline">project</code> containing{" "}
          <strong style={{ color: "var(--ai)" }}>"ARC AI"</strong> — e.g. <em>"ARC AI 5min Scripts"</em>.
        </EmptyState>
      </Panel>
    );
  }

  const placeholder =
    tab === "runs"   ? "Search project, build, cluster…" :
    tab === "errors" ? "Search step, error message, project…" :
                       "Search step, project…";

  return (
    <div className="stack">
      {/* ── SWW alert banner ── */}
      {swwCount > 0 && (
        <div className="banner banner-danger sww fu" role="alert">
          <div className="banner-icon"><Siren size={17} /></div>
          <div className="grow">
            <h4>Something Went Wrong — AI gave no response</h4>
            <p>
              <strong style={{ color: "var(--danger)" }}>{swwCount} step{swwCount > 1 ? "s" : ""}</strong> returned{" "}
              <code className="inline">"No Response"</code> — the AI model failed to respond. Open the <strong>SWW Log</strong> to investigate.
            </p>
          </div>
          <button className="btn btn-danger" onClick={() => switchTab("sww")}>View SWW log <ArrowRight size={14} /></button>
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="kpi-grid">
        <KpiCard label="AI script runs" value={totalRuns}   tone="ai"     icon={Sparkles}      sub="ARC AI projects" delay={0} />
        <KpiCard label="Failed runs"    value={failedRuns}  tone="danger" icon={CircleX}       sub="Runs with failures" delay={40} />
        <KpiCard label="Steps checked"  value={totalSteps}  tone="info"   icon={ListChecks}    sub="AI queries executed" delay={80} />
        <KpiCard label="Step failures"  value={totalFailed} tone="warn"   icon={TriangleAlert} sub="Individual step fails" delay={120} />
        <KpiCard label="Failure rate"   value={parseFloat(failRate)} dec={1} suffix="%" tone={healthTone(parseFloat(failRate))} icon={Percent} sub="Steps failed" delay={160} />
        <KpiCard label="Something Went Wrong" value={swwCount} tone="danger" icon={Ban} delay={200}
          sub={swwCount > 0 ? "Click to open SWW log" : "No silent AI failures"}
          alerting={swwCount > 0} selected={swwCount > 0 && tab === "sww"}
          onClick={swwCount > 0 ? () => switchTab("sww") : undefined}
          badge={swwCount > 0 ? <Badge tone="danger" pulse>ALERT</Badge> : null} />
      </div>

      {/* ── Tabs + search ── */}
      <div className="toolbar">
        <Segmented ariaLabel="ARC AI views" value={tab} onChange={switchTab} options={[
          { id: "runs",   label: "Run History", icon: History,     count: aiRuns.length },
          { id: "errors", label: "Error Log",   icon: FileWarning, count: errorSteps.length },
          { id: "sww",    label: "SWW Log",     icon: Ban,         count: swwCount, alert: swwCount > 0 },
        ]} />
        <SearchField value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder={placeholder} />
      </div>

      {/* ── RUN HISTORY ── */}
      {tab === "runs" && (
        <Panel title="ARC AI — Run history" sub="Click a run to inspect each AI query, error and response body" icon={Sparkles} className="fi"
          actions={<Badge tone="ai">{filtered.length} runs</Badge>}>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No runs match your search" />
          ) : (
            <div className="table-wrap">
              <table className="dt">
                <thead>
                  <tr>
                    <th className="chev-cell" />
                    <th>Timestamp</th><th>Project</th><th>Cluster</th>
                    <th>Build</th><th>Steps</th><th>SWW</th><th>Duration</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => {
                    const open   = expanded === r._id;
                    const runSWW = (r.steps || []).filter(s => isSWW(s)).length;
                    return (
                      <Fragment key={r._id}>
                        <tr className={`hoverable clickable${open ? " expanded" : ""}${runSWW > 0 && !open ? " row-sww" : ""}`}
                          onClick={() => setExpanded(open ? null : r._id)} aria-expanded={open}>
                          <td className="chev-cell"><ChevronRight size={15} className={`chev-rot${open ? " open" : ""}`} /></td>
                          <td className="mono nowrap muted">{fmtTime(r.timestamp)}</td>
                          <td className="strong">{r.project}</td>
                          <td><Badge tone="neutral">{r.cluster || "—"}</Badge></td>
                          <td><BuildBadge build={r.build_number} tone="ai" /></td>
                          <td><StepsTally passed={r.passed_steps} failed={r.failed_steps} total={r.total_steps} /></td>
                          <td>{runSWW > 0 ? <Badge tone="danger" icon={TriangleAlert}>{runSWW}</Badge> : <span className="muted">—</span>}</td>
                          <td className="mono muted">{fmtDur(r.total_duration)}</td>
                          <td><RunStatus failed={r.has_failure} /></td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={9} className="expand-cell">
                              <StepTrace steps={r.steps || []} ai title="Step trace — AI response details" />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Paginator page={page} pages={totalPages} setPage={setPage} total={filtered.length} per={PER} />
        </Panel>
      )}

      {/* ── ERROR LOG ── */}
      {tab === "errors" && (
        <Panel title="ARC AI — Error log" sub="Every failed step, error message or response body captured" icon={FileWarning} className="fi"
          actions={<>
            <Badge tone="danger">{filtered.length} entries</Badge>
            {filtered.length > 0 && (
              <button className="btn btn-sm" onClick={() => downloadCSV("arc-ai-error-log", filtered, [
                { label: "Timestamp", get: e => e.run_ts },
                { label: "Project", get: e => e.project },
                { label: "Build", get: e => e.build },
                { label: "Cluster", get: e => e.cluster },
                { label: "Step / Query", get: e => e.step },
                { label: "Status", get: e => e.status },
                { label: "Response time (s)", get: e => e.resp_time },
                { label: "Error message", get: e => e.error_msg },
                { label: "Response body", get: e => e.resp_body },
                { label: "SWW", get: e => (e.sww ? "Yes" : "") },
              ])}><Download size={13} /> CSV</button>
            )}
          </>}>
          {filtered.length === 0 ? (
            <EmptyState icon={ShieldCheck} tone="success" title="No errors logged">All AI step executions passed without errors.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Timestamp</th><th>Project</th><th>Build</th><th>Step / Query</th>
                    <th>Status</th><th>Resp time</th><th>Error message</th><th>Response body</th><th>SWW</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e, i) => (
                    <tr key={i} className={`hoverable${e.sww ? " row-sww" : ""}`}>
                      <td className="mono nowrap muted">{fmtTime(e.run_ts)}</td>
                      <td className="strong nowrap">{e.project}</td>
                      <td><BuildBadge build={e.build} tone="ai" /></td>
                      <td style={{ maxWidth: 220 }}><div className="truncate" style={{ color: "var(--text-0)", fontWeight: 500 }} title={e.step}>{e.step}</div></td>
                      <td><Badge tone={e.success ? "success" : "danger"} mono>{e.status}</Badge></td>
                      <td className="mono muted">{e.resp_time?.toFixed(2)}s</td>
                      <td style={{ maxWidth: 240 }}>
                        {e.error_msg && !e.sww ? (
                          <div className="mono clamp2" style={{ fontSize: 12, color: "var(--danger)" }} title={e.error_msg}>{e.error_msg}</div>
                        ) : e.sww ? (
                          <em style={{ fontSize: 12, color: "var(--danger)" }}>No Response</em>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        {e.resp_body && !e.sww ? (
                          <div className="mono clamp2" style={{ fontSize: 12, color: "var(--text-2)" }} title={e.resp_body}>{e.resp_body}</div>
                        ) : e.sww ? (
                          <em style={{ fontSize: 12, color: "var(--danger)" }}>No Response</em>
                        ) : <span className="muted">—</span>}
                      </td>
                      <td>{e.sww ? <Badge tone="danger" icon={TriangleAlert} pulse>SWW</Badge> : <span className="muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginator page={page} pages={totalPages} setPage={setPage} total={filtered.length} per={PER} />
        </Panel>
      )}

      {/* ── SWW LOG ── */}
      {tab === "sww" && (
        <Panel title="Something Went Wrong — Full log" icon={Ban} className={`fi${swwCount > 0 ? " danger-outline" : ""}`}
          sub={`Steps where AI returned "No Response" — model completely failed to respond`}
          actions={<Badge tone={swwCount > 0 ? "danger" : "neutral"}>{swwCount} occurrence{swwCount !== 1 ? "s" : ""}</Badge>}>
          {filtered.length === 0 ? (
            <EmptyState icon={ShieldCheck} tone="success" title={`No "Something Went Wrong" events`}>AI has responded to all queries successfully.</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="dt">
                <thead>
                  <tr>
                    <th>Timestamp</th><th>Project</th><th>Build</th>
                    <th>Step / Query</th><th>Status</th><th>Resp time</th>
                    <th>error_msg</th><th>response_body</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e, i) => (
                    <tr key={i} className="hoverable row-sww">
                      <td className="mono nowrap muted">{fmtTime(e.run_ts)}</td>
                      <td className="strong nowrap">{e.project}</td>
                      <td><BuildBadge build={e.build} tone="ai" /></td>
                      <td style={{ maxWidth: 260 }}><div className="truncate strong" title={e.step}>{e.step}</div></td>
                      <td><Badge tone="danger" mono>{e.status}</Badge></td>
                      <td className="mono muted">{e.resp_time?.toFixed(2)}s</td>
                      <td><Badge tone="danger" mono>"No Response"</Badge></td>
                      <td><Badge tone="danger" mono>"No Response"</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Paginator page={page} pages={totalPages} setPage={setPage} total={filtered.length} per={PER} />
        </Panel>
      )}
    </div>
  );
}
