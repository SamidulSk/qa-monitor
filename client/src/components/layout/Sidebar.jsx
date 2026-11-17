// src/components/layout/Sidebar.jsx
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NAV } from "../../lib/constants";
import { POLL_MS } from "../../lib/api";

export function Sidebar({ active, onNavigate, failCount, swwCount, collapsed, onToggleCollapse, drawer, onClose, online }) {
  const groups = [...new Set(NAV.map(n => n.group))];
  const isCollapsed = collapsed && !drawer;

  return (
    <aside className={`sidebar${isCollapsed ? " collapsed" : ""}${drawer ? " drawer" : ""}`} aria-label="Primary">
      <div className="sb-brand" title="ARC Document Solutions">
        <div className="sb-logo">ARC</div>
        <div className="sb-wordmark grow">
          <b>Document Solutions</b>
          <span>QA Monitor</span>
        </div>
        {drawer && (
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close menu"><X size={16} /></button>
        )}
      </div>

      <div className={`sb-live${online ? "" : " offline"}`} title={online ? "Receiving live data" : "API unreachable"}>
        <span className="live-dot" />
        <span className="sb-live-text">{online ? "QA Monitor · Live" : "Connection issue"}</span>
      </div>

      <nav className="sb-nav">
        {groups.map(g => (
          <div key={g}>
            <div className="sb-group">{g}</div>
            {NAV.filter(n => n.group === g).map((item) => {
              const { id, label, sub, ai } = item;
              const Icon = item.icon;
              const on = active === id;
              const showFail = id === "failures" && failCount > 0;
              const showSww  = id === "arcai" && swwCount > 0;
              return (
                <button key={id}
                  className={`sb-item${on ? " active" : ""}`}
                  onClick={() => { onNavigate(id); onClose?.(); }}
                  title={isCollapsed ? `${label} — ${sub}` : sub}
                  aria-current={on ? "page" : undefined}>
                  <Icon size={17} strokeWidth={on ? 2.2 : 1.9} />
                  <span className="sb-label">{label}</span>
                  {ai && <span className="sb-tag">AI</span>}
                  {showFail && <span className="sb-count" title={`${failCount} failed runs`}>{failCount}</span>}
                  {showSww && <span className="sb-count" title={`${swwCount} Something Went Wrong events`}>{swwCount}</span>}
                  {isCollapsed && (showFail || showSww) && <span className="sb-pip" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-text">
          <div>Poll interval: {POLL_MS / 1000} s</div>
          <div>v3.0 · Internal Tool</div>
        </div>
        {!drawer && (
          <button className="btn btn-ghost btn-icon" onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        )}
      </div>
    </aside>
  );
}
