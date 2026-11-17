// src/components/monitoring/StepTrace.jsx
// Expanded step-by-step execution trace for a single run.
import { useState } from "react";
import { Check, X, TriangleAlert, Ban, ChevronRight, FileText } from "lucide-react";
import { Badge } from "../ui/primitives";
import { isSWW } from "../../lib/arcai";
import { statusTone } from "../../lib/format";

/* Collapsible response body — same behaviour as the original ResponseBodyBlock */
export function ResponseBodyBlock({ body }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ margin: "0 12px 10px 42px" }}>
      <button className="link-btn" style={{ color: "var(--ai)" }} onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <ChevronRight size={13} className={`chev-rot${open ? " open" : ""}`} style={open ? { color: "var(--ai)" } : undefined} />
        <FileText size={13} /> Response body
      </button>
      {open && <pre className="log-pre">{body}</pre>}
    </div>
  );
}

/**
 * @param steps  run.steps
 * @param ai     when true, applies ARC AI "Something Went Wrong" detection
 *               and always shows response bodies (original ARC AI behaviour)
 */
export function StepTrace({ steps = [], ai = false, title }) {
  const failed = steps.filter(s => !s.is_success).length;
  return (
    <div className="trace">
      <div className="trace-head">
        <span>{title || "Step execution trace"}</span>
        <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "var(--text-3)" }}>
          {steps.length} steps{failed > 0 ? ` · ${failed} failed` : ""}
        </span>
      </div>
      <div className="trace-list">
        {steps.map((s, si) => {
          const sww = ai && isSWW(s);
          const fail = !s.is_success;
          const cls = sww ? "sww" : fail ? "fail" : "";
          const Icon = sww ? TriangleAlert : fail ? X : Check;
          const iconColor = sww || fail ? "var(--danger)" : "var(--success)";
          return (
            <div key={si} className={`trace-step ${cls}`} style={{ animationDelay: `${Math.min(si, 25) * 18}ms` }}>
              <div className="trace-row">
                <span className="trace-idx">{si + 1}</span>
                <Icon size={15} strokeWidth={2.6} style={{ color: iconColor, flexShrink: 0 }} />
                <span className="trace-name">{s.step}</span>
                {sww && <Badge tone="danger" pulse>SOMETHING WENT WRONG</Badge>}
                <span className="trace-meta">
                  <span>{s.response_time?.toFixed(2)}s</span>
                  <span style={{ color: `var(--${statusTone(s.status_code)})`, fontWeight: 600, minWidth: 34, textAlign: "right" }}>{s.status_code}</span>
                </span>
              </div>

              {sww && (
                <div className="trace-detail err">
                  <div className="trace-detail-label" style={{ color: "var(--danger)" }}><Ban size={12} /> AI did not respond — Something Went Wrong</div>
                  <div style={{ fontSize: 13, color: "var(--text-1)", lineHeight: 1.55 }}>
                    <code className="inline">error_msg</code> or <code className="inline">response_body</code> returned <strong>"No Response"</strong>.
                    The AI model completely failed to process this query.
                  </div>
                </div>
              )}

              {s.error_msg && !sww && (
                <div className="trace-detail err">
                  <div className="trace-detail-label" style={{ color: "var(--danger)" }}>Error message</div>
                  <div className="log-text">{s.error_msg}</div>
                </div>
              )}

              {s.response_body && !sww && <ResponseBodyBlock body={s.response_body} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
