// src/components/layout/CommandPalette.jsx
// Linear-style quick switcher: Ctrl/⌘ + K. Navigation + a few global actions.
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, RefreshCw, SunMoon, FilterX, CornerDownLeft, ArrowUp, ArrowDown, Tv, Bell } from "lucide-react";
import { NAV } from "../../lib/constants";

export function CommandPalette({ open, onClose, onNavigate, onRefresh, onToggleTheme, onClearFilters, onTv, onToggleNotify }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const items = useMemo(() => {
    const all = [
      ...NAV.map(n => ({ id: `go-${n.id}`, group: "Go to", label: n.label, hint: n.sub, icon: n.icon, run: () => onNavigate(n.id) })),
      { id: "refresh", group: "Actions", label: "Refresh data",    icon: RefreshCw, run: onRefresh },
      { id: "theme",   group: "Actions", label: "Toggle theme",    icon: SunMoon,   run: onToggleTheme },
      { id: "clear",   group: "Actions", label: "Clear all filters", icon: FilterX, run: onClearFilters },
      { id: "tv",      group: "Actions", label: "TV mode (wall display)", hint: "Fullscreen, auto-rotating", icon: Tv, run: onTv },
      { id: "notify",  group: "Actions", label: "Toggle failure alerts", icon: Bell, run: onToggleNotify },
    ];
    const s = q.trim().toLowerCase();
    return s ? all.filter(i => `${i.label} ${i.hint || ""}`.toLowerCase().includes(s)) : all;
  }, [q, onNavigate, onRefresh, onToggleTheme, onClearFilters, onTv, onToggleNotify]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); }, [open]);

  if (!open) return null;

  const close = () => { setQ(""); setIdx(0); onClose(); };
  const exec = (item) => { if (!item) return; item.run(); close(); };
  const sel = Math.min(idx, Math.max(items.length - 1, 0));

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(Math.min(sel + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(Math.max(sel - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); exec(items[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  let lastGroup = null;
  return (
    <div className="cmdk-backdrop" onMouseDown={close}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command menu" onMouseDown={e => e.stopPropagation()}>
        <div className="cmdk-input">
          <Search size={16} />
          <input ref={inputRef} value={q} placeholder="Type a command or search pages…"
            onChange={e => { setQ(e.target.value); setIdx(0); }} onKeyDown={onKey} />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-list" role="listbox">
          {items.length === 0 && <div className="cmdk-group" style={{ textTransform: "none", padding: 14 }}>No results</div>}
          {items.map((it, i) => {
            const header = it.group !== lastGroup ? <div className="cmdk-group" key={`g-${it.group}`}>{it.group}</div> : null;
            lastGroup = it.group;
            const Icon = it.icon;
            return [
              header,
              <button key={it.id} role="option" aria-selected={i === sel}
                className={`cmdk-item${i === sel ? " on" : ""}`}
                onMouseMove={() => setIdx(i)} onClick={() => exec(it)}>
                <Icon size={16} />
                {it.label}
                {it.hint && <span className="hint">{it.hint}</span>}
              </button>,
            ];
          })}
        </div>
        <div className="cmdk-foot">
          <span><ArrowUp size={12} /><ArrowDown size={12} /> navigate</span>
          <span><CornerDownLeft size={12} /> select</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
