// src/components/layout/TvBar.jsx — header for the office wall-display mode
import { useEffect, useState } from "react";
import { Pause, Play, Minimize2 } from "lucide-react";
import { PAGES } from "../../lib/constants";

export function TvBar({ page, pages, rotating, setRotating, intervalMs, onExit, children }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const iv = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(iv); }, []);
  const idx = pages.indexOf(page);
  return (
    <div className="tvbar">
      <div className="sb-logo">ARC</div>
      <div>
        <div className="tv-clock">{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
        <div className="tv-date">{now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" })}</div>
      </div>
      <span className="vdiv" />
      <div className="grow">
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-0)" }}>{PAGES[page]?.title}</div>
        <div className="tv-dots" style={{ marginTop: 6 }}>
          {pages.map((p, i) => (
            <i key={`${p}-${i === idx ? page : ""}`}
              className={i === idx ? `on${rotating ? "" : " static"}` : i < idx ? "done" : ""}
              style={{ "--dur": `${intervalMs}ms` }} title={PAGES[p]?.title} />
          ))}
        </div>
      </div>
      {children}
      <button className="btn" onClick={() => setRotating(r => !r)} title={rotating ? "Pause rotation" : "Resume rotation"}>
        {rotating ? <Pause size={14} /> : <Play size={14} />} {rotating ? "Pause" : "Rotate"}
      </button>
      <button className="btn btn-primary" onClick={onExit} title="Exit TV mode (Esc)"><Minimize2 size={14} /> Exit</button>
    </div>
  );
}
