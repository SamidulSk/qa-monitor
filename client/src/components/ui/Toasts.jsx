// src/components/ui/Toasts.jsx
import { useCallback, useEffect, useState } from "react";
import { X, CircleX, Info, CircleCheck } from "lucide-react";

const ICONS = { danger: CircleX, info: Info, success: CircleCheck };

function Toast({ t, onDismiss }) {
  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(t.id), 220);   // let the exit animation finish
  }, [t.id, onDismiss]);
  useEffect(() => {
    const id = setTimeout(close, t.ttl || 9000);
    return () => clearTimeout(id);
  }, [t.ttl, close]);
  const Icon = ICONS[t.tone] || Info;
  return (
    <div className={`toast toast-${t.tone || "info"}${leaving ? " leaving" : ""}`} role="status">
      <span className="toast-icon"><Icon size={16} /></span>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="toast-title">{t.title}</div>
        {t.body && <div className="toast-body">{t.body}</div>}
        {t.action && (
          <button className="link-btn" style={{ color: "var(--accent)", marginTop: 4 }}
            onClick={() => { t.action.run(); close(); }}>{t.action.label} →</button>
        )}
      </div>
      <button className="btn btn-ghost btn-icon btn-sm" style={{ width: 24, height: 24 }} onClick={close} aria-label="Dismiss">
        <X size={13} />
      </button>
      <span className="toast-timer" style={{ animationDuration: `${t.ttl || 9000}ms` }} />
    </div>
  );
}

export function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => <Toast key={t.id} t={t} onDismiss={onDismiss} />)}
    </div>
  );
}
