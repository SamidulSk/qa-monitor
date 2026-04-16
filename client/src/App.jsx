import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "https://qa-monitor.onrender.com";
const TOKEN    = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_TOKEN) || "qa_monitor_secret_2026_xK9mP2";
const POLL_MS  = 30000;

/* ─── RETRY FETCH ─────────────────────────────────────────────
   Render free tier sleeps after 15min. On ERR_CONNECTION_CLOSED
   we retry up to 4 times with exponential backoff (2s,4s,8s,16s).
   This covers the ~30s cold-start window transparently.
──────────────────────────────────────────────────────────────── */
async function fetchWithRetry(url, options = {}, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      const isConnectionErr =
        err.message.includes("Failed to fetch") ||
        err.message.includes("ERR_CONNECTION") ||
        err.message.includes("NetworkError") ||
        err.message.includes("network");
      if (isConnectionErr && attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
        continue;
      }
      throw err;
    }
  }
}

/* ─── DESIGN TOKENS ───────────────────────────────────────────── */
const light = {
  bg:          "#F7F8FA",
  bg1:         "#FFFFFF",
  bg2:         "#F0F2F5",
  bg3:         "#E8EBF0",
  sidebar:     "#1A2332",
  sidebarHov:  "#243044",
  border:      "#E2E6EC",
  borderMid:   "#CDD3DC",
  text0:       "#0F1923",
  text1:       "#374151",
  text2:       "#6B7280",
  text3:       "#9CA3AF",
  accent:      "#1D6AE5",
  accentLight: "#EBF2FF",
  accentMid:   "#3B82F6",
  success:     "#059669",
  successBg:   "#ECFDF5",
  warn:        "#D97706",
  warnBg:      "#FFFBEB",
  danger:      "#DC2626",
  dangerBg:    "#FEF2F2",
  info:        "#0284C7",
  infoBg:      "#F0F9FF",
  gold:        "#B45309",
  goldBg:      "#FFFBEB",
  shadow:      "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd:    "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  shadowLg:    "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)",
};

const dark = {
  bg:          "#0D1117",
  bg1:         "#161B22",
  bg2:         "#1C2330",
  bg3:         "#212936",
  sidebar:     "#0D1117",
  sidebarHov:  "#1C2330",
  border:      "#30363D",
  borderMid:   "#444C56",
  text0:       "#E6EDF3",
  text1:       "#B1BAC4",
  text2:       "#8B949E",
  text3:       "#484F58",
  accent:      "#3B82F6",
  accentLight: "rgba(59,130,246,0.12)",
  accentMid:   "#60A5FA",
  success:     "#2EA043",
  successBg:   "rgba(46,160,67,0.12)",
  warn:        "#F0883E",
  warnBg:      "rgba(240,136,62,0.12)",
  danger:      "#F85149",
  dangerBg:    "rgba(248,81,73,0.12)",
  info:        "#58A6FF",
  infoBg:      "rgba(88,166,255,0.12)",
  gold:        "#E3B341",
  goldBg:      "rgba(227,179,65,0.12)",
  shadow:      "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)",
  shadowMd:    "0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)",
  shadowLg:    "0 8px 24px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)",
};

/* ─── GLOBAL CSS ──────────────────────────────────────────────── */
const makeCSS = (t, isDark) => `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;font-size:15px}
body{
  background:${t.bg};color:${t.text0};
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;
  line-height:1.6;-webkit-font-smoothing:antialiased;
  min-height:100vh;overflow-x:hidden;
  transition:background .3s,color .3s;
}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:${t.bg2}}
::-webkit-scrollbar-thumb{background:${t.border};border-radius:99px}
::-webkit-scrollbar-thumb:hover{background:${t.borderMid}}
::selection{background:${t.accentLight};color:${t.accent}}

@keyframes fadeUp{
  from{opacity:0;transform:translateY(14px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes countUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes shimmer{
  0%{background-position:-400px 0}
  100%{background-position:400px 0}
}
@keyframes wakeUp{
  0%{width:0%}100%{width:100%}
}
@keyframes barGrow{from{width:0}to{width:var(--bar-w)}}

.fu{animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
.fi{animation:fadeIn .3s ease both}
.sr{animation:slideRight .35s cubic-bezier(.22,1,.36,1) both}

.card{
  background:${t.bg1};
  border:1px solid ${t.border};
  border-radius:12px;
  box-shadow:${t.shadow};
  transition:border-color .2s,box-shadow .2s;
  position:relative;overflow:hidden;
}
.card:hover{
  border-color:${t.borderMid};
  box-shadow:${t.shadowMd};
}

.btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:9px 18px;border-radius:8px;
  border:1px solid ${t.border};
  background:${t.bg1};color:${t.text1};
  font-family:'Plus Jakarta Sans',sans-serif;font-size:14px;
  font-weight:500;cursor:pointer;
  transition:all .15s;white-space:nowrap;
}
.btn:hover{
  background:${t.bg2};border-color:${t.borderMid};
  color:${t.text0};box-shadow:${t.shadow};
}
.btn:disabled{opacity:0.45;cursor:not-allowed}
.btn.primary{
  background:${t.accent};border-color:${t.accent};color:#fff;
}
.btn.primary:hover{
  background:${t.accentMid};border-color:${t.accentMid};
  box-shadow:0 4px 12px ${isDark?"rgba(59,130,246,0.35)":"rgba(29,106,229,0.25)"};
}
.btn.ghost{
  background:transparent;border-color:transparent;
}
.btn.ghost:hover{background:${t.bg2};border-color:${t.border}}

.badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:3px 10px;font-size:12px;font-weight:600;
  border-radius:6px;font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:0.01em;
}
.badge-ok    {background:${t.successBg};color:${t.success}}
.badge-fail  {background:${t.dangerBg};color:${t.danger}}
.badge-warn  {background:${t.warnBg};color:${t.warn}}
.badge-info  {background:${t.infoBg};color:${t.info}}
.badge-gold  {background:${t.goldBg};color:${t.gold}}
.badge-muted {background:${t.bg2};color:${t.text2};border:1px solid ${t.border}}

input,select{
  background:${t.bg2};border:1px solid ${t.border};border-radius:8px;
  color:${t.text0};font-family:'Plus Jakarta Sans',sans-serif;
  font-size:14px;padding:8px 12px;outline:none;
  transition:border-color .15s,box-shadow .15s;
}
input:focus,select:focus{
  border-color:${t.accent};
  box-shadow:0 0 0 3px ${isDark?"rgba(59,130,246,0.2)":"rgba(29,106,229,0.12)"};
}
select option{background:${t.bg2};color:${t.text0}}

table{border-collapse:collapse;width:100%}
th{
  color:${t.text3};font-size:12px;font-weight:600;letter-spacing:0.04em;
  padding:11px 16px;border-bottom:1px solid ${t.border};
  text-align:left;white-space:nowrap;
  background:${t.bg2};
}
td{
  padding:12px 16px;border-bottom:1px solid ${t.border};
  font-size:14px;color:${t.text1};vertical-align:middle;
}
tr:last-child td{border-bottom:none}
tbody tr{transition:background .12s}
tbody tr:hover td{background:${t.bg2};color:${t.text0}}

.skeleton{
  background:linear-gradient(90deg,${t.bg2} 25%,${t.bg3} 50%,${t.bg2} 75%);
  background-size:400px 100%;animation:shimmer 1.4s ease infinite;
  border-radius:6px;
}
`;

/* ─── UTILS ───────────────────────────────────────────────────── */
const fmtTime = d => new Date(d).toLocaleString("en-IN",{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
const fmtDur  = s => s >= 60 ? `${(s/60).toFixed(1)} min` : `${(s||0).toFixed(1)}s`;
const fmtPct  = n => `${parseFloat(n||0).toFixed(1)}%`;

const healthColor = (rate, t) => {
  const v = parseFloat(rate);
  if (v === 0)  return t.success;
  if (v < 10)   return t.info;
  if (v < 30)   return t.warn;
  return t.danger;
};

const statusColor = (code, t) => {
  const c = parseInt(code);
  if (c >= 200 && c < 300) return t.success;
  if (c >= 400 && c < 500) return t.warn;
  return t.danger;
};

/* ─── ANIMATED COUNTER ────────────────────────────────────────── */
function Counter({ to, dec = 0, suffix = "" }) {
  const [v, setV] = useState(0);
  const raf = useRef();
  const prev = useRef(0);
  useEffect(() => {
    const target = parseFloat(to) || 0;
    const from = prev.current;
    prev.current = target;
    const t0 = Date.now(), dur = 700;
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to]);
  return <>{dec ? v.toFixed(dec) : Math.round(v).toLocaleString()}{suffix}</>;
}

/* ─── SPARKLINE ───────────────────────────────────────────────── */
function Spark({ data = [], color, w = 72, h = 32 }) {
  if (!data || data.length < 2) return <div style={{width:w,height:h}}/>;
  const max = Math.max(...data, 1);
  const coords = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - 4 - (v / max) * (h - 8),
  }));
  const line = coords.map(c=>`${c.x},${c.y}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#","")})`}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.75"
        strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={coords[coords.length-1].x} cy={coords[coords.length-1].y}
        r="3" fill={color}/>
    </svg>
  );
}

/* ─── RADIAL GAUGE ────────────────────────────────────────────── */
function Gauge({ failRate = 0, t, size = 72 }) {
  const r = 26, circ = 2 * Math.PI * r;
  const health = 100 - Math.min(parseFloat(failRate)||0, 100);
  const col = healthColor(failRate, t);
  const dash = circ * (health / 100);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke={t.bg3} strokeWidth="6"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6"
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{transition:"stroke-dasharray 1s cubic-bezier(.22,1,.36,1)"}}/>
      <text x="36" y="33" textAnchor="middle" fontSize="12" fontWeight="700"
        fill={col} fontFamily="'Plus Jakarta Sans',sans-serif">{Math.round(health)}%</text>
      <text x="36" y="46" textAnchor="middle" fontSize="8.5" fill={t.text3}
        fontFamily="'Plus Jakarta Sans',sans-serif">HEALTH</text>
    </svg>
  );
}

/* ─── WAKE-UP BANNER ──────────────────────────────────────────── */
function WakeBanner({ t }) {
  const [prog, setP] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setP(p => Math.min(p + 2.5, 95)), 750);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{
      background:t.infoBg, border:`1px solid ${t.info}40`,
      borderRadius:10, padding:"14px 18px", marginBottom:20,
      display:"flex", flexDirection:"column", gap:8,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:t.info,animation:"pulse 1.2s ease infinite"}}/>
        <span style={{fontSize:14,color:t.info,fontWeight:600}}>Server is waking up — retrying automatically</span>
      </div>
      <div style={{background:t.bg2,borderRadius:99,height:4,overflow:"hidden"}}>
        <div style={{width:`${prog}%`,height:"100%",background:t.info,borderRadius:99,transition:"width 0.7s ease"}}/>
      </div>
      <span style={{fontSize:13,color:t.text2}}>Render free tier spins down after 15 min of inactivity. First request takes ~30 seconds. This is normal.</span>
    </div>
  );
}

/* ─── LOGO ────────────────────────────────────────────────────── */
function Logo({ t }) {
  return (
    <div style={{padding:"24px 20px 20px",borderBottom:`1px solid rgba(255,255,255,0.08)`}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{
          width:42,height:42,flexShrink:0,borderRadius:10,
          background:"linear-gradient(135deg,#1D6AE5,#0EA5E9)",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 14px rgba(29,106,229,0.45)",
        }}>
          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15,color:"#fff",letterSpacing:"-0.02em"}}>ARC</span>
        </div>
        <div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15,color:"#fff",letterSpacing:"-0.01em",lineHeight:1.2}}>
            Document Solutions
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",letterSpacing:"0.02em",marginTop:1}}>
            QA Monitoring Platform
          </div>
        </div>
      </div>
      <div style={{
        display:"flex",alignItems:"center",gap:7,padding:"7px 12px",
        background:"rgba(46,160,67,0.15)",borderRadius:7,
        border:"1px solid rgba(46,160,67,0.25)",
      }}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#2EA043",flexShrink:0,animation:"pulse 2.5s ease infinite"}}/>
        <span style={{fontSize:12,color:"#7EE787",fontWeight:500,letterSpacing:"0.02em"}}>Live — auto-refresh 30s</span>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────────── */
const NAV = [
  { id:"overview", label:"Overview",       sub:"System health" },
  { id:"failures", label:"Failure Tracker",sub:"Failed steps" },
  { id:"products", label:"Products",       sub:"Per-product view" },
  { id:"runs",     label:"Run History",    sub:"Execution log" },
  { id:"steps",    label:"Step Analytics", sub:"Step breakdown" },
  { id:"builds",   label:"Build Tracker",  sub:"Build diagnostics" },
];

const NAV_ICONS = {
  overview: "▦",
  failures: "⚠",
  products: "◈",
  runs:     "⊙",
  steps:    "≡",
  builds:   "⌗",
};

function Sidebar({ active, set, failCount, t }) {
  return (
    <aside style={{
      width:230,flexShrink:0,background:t.sidebar,
      borderRight:"1px solid rgba(255,255,255,0.06)",
      display:"flex",flexDirection:"column",
      height:"100vh",position:"sticky",top:0,zIndex:20,
    }}>
      <Logo t={t}/>
      <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:1,overflow:"auto"}}>
        {NAV.map(({id,label,sub}) => {
          const on = active === id;
          return (
            <button key={id} onClick={()=>set(id)} style={{
              display:"flex",alignItems:"center",gap:10,
              padding:"10px 14px",borderRadius:8,border:"none",
              cursor:"pointer",textAlign:"left",width:"100%",
              background: on ? "rgba(59,130,246,0.18)" : "transparent",
              transition:"background .15s",
            }}>
              <span style={{
                fontSize:15,color: on ? "#60A5FA" : "rgba(255,255,255,0.3)",
                width:20,textAlign:"center",flexShrink:0,
                transition:"color .15s",
              }}>{NAV_ICONS[id]}</span>
              <div style={{flex:1}}>
                <div style={{
                  fontSize:14,fontWeight: on ? 600 : 400,
                  color: on ? "#E6EDF3" : "rgba(255,255,255,0.5)",
                  transition:"color .15s",
                  display:"flex",alignItems:"center",gap:8,
                }}>
                  {label}
                  {id==="failures" && failCount>0 && (
                    <span style={{
                      background:"#F85149",color:"#fff",borderRadius:99,
                      fontSize:11,fontWeight:700,padding:"1px 6px",lineHeight:1.4,
                      animation:"pulse 2s ease infinite",
                    }}>{failCount}</span>
                  )}
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",marginTop:1}}>{sub}</div>
              </div>
              {on && <div style={{width:2,height:24,background:"#3B82F6",borderRadius:99,flexShrink:0}}/>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:"14px 20px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.25)",lineHeight:1.9}}>
          <div>Poll interval: 30 seconds</div>
          <div>v2.1 · Internal Tool</div>
        </div>
      </div>
    </aside>
  );
}

/* ─── TOPBAR ──────────────────────────────────────────────────── */
function Topbar({ lastUpdated, loading, onRefresh, filters, setFilters, projects, clusters, t, isDark, setDark }) {
  return (
    <header style={{
      height:58,borderBottom:`1px solid ${t.border}`,
      display:"flex",alignItems:"center",padding:"0 24px",gap:10,
      background:`${t.bg1}F2`,backdropFilter:"blur(12px)",
      position:"sticky",top:0,zIndex:10,flexShrink:0,
    }}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        {[
          ["project",     "All products",  projects.map(p=>({v:p,l:p}))],
          ["cluster",     "All clusters",  clusters.map(c=>({v:c,l:c}))],
          ["script_type", "All scripts",   [{v:"5min",l:"5 min"},{v:"30min",l:"30 min"}]],
          ["status",      "All statuses",  [{v:"failed",l:"Failures only"},{v:"passed",l:"Passed only"}]],
        ].map(([key,ph,opts]) => (
          <select key={key} value={filters[key]||""} onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))} style={{minWidth:148,fontSize:14}}>
            <option value="">{ph}</option>
            {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
        <input type="date" value={filters.from||""} onChange={e=>setFilters(f=>({...f,from:e.target.value}))} style={{width:144}}/>
        <input type="date" value={filters.to||""}   onChange={e=>setFilters(f=>({...f,to:e.target.value}))}   style={{width:144}}/>
        {Object.values(filters).some(Boolean) && (
          <button className="btn ghost" onClick={()=>setFilters({})} style={{fontSize:13}}>
            Clear filters ×
          </button>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {lastUpdated && (
          <span style={{fontSize:13,color:t.text3,whiteSpace:"nowrap"}}>
            Updated {fmtTime(lastUpdated)}
          </span>
        )}
        <button className="btn ghost" onClick={()=>setDark(d=>!d)}
          title="Toggle theme" style={{padding:"8px 10px",fontSize:16}}>
          {isDark ? "☀" : "◑"}
        </button>
        <button className="btn primary" onClick={onRefresh} style={{gap:6}}>
          <span style={loading?{display:"inline-block",animation:"spin 0.7s linear infinite"}:{}}
            aria-hidden="true">↻</span>
          Refresh
        </button>
      </div>
    </header>
  );
}

/* ─── SECTION WRAPPER ─────────────────────────────────────────── */
function Section({ title, sub, children, t, action, flush = false }) {
  return (
    <div className="card" style={{overflow:"hidden"}}>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"16px 20px",borderBottom:`1px solid ${t.border}`,
        background:t.bg2,
      }}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:t.text0}}>{title}</div>
          {sub && <div style={{fontSize:13,color:t.text3,marginTop:2}}>{sub}</div>}
        </div>
        {action}
      </div>
      <div style={flush?{}:{padding:"0"}}>{children}</div>
    </div>
  );
}

/* ─── KPI CARD ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, spark, delay=0, dec=0, suffix="", t }) {
  return (
    <div className="card fu" style={{padding:"20px 22px",animationDelay:`${delay}ms`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{
          width:36,height:36,borderRadius:8,
          background:`${color}18`,
          display:"flex",alignItems:"center",justifyContent:"center",
          flexShrink:0,
        }}>
          <div style={{width:10,height:10,borderRadius:"50%",background:color}}/>
        </div>
        {spark && <Spark data={spark} color={color}/>}
      </div>
      <div style={{
        fontSize:30,fontWeight:700,color,lineHeight:1,letterSpacing:"-0.02em",
        animation:"countUp 0.5s ease both",animationDelay:`${delay+150}ms`,
        fontVariantNumeric:"tabular-nums",
      }}>
        <Counter to={value} dec={dec} suffix={suffix}/>
      </div>
      <div style={{fontSize:13,fontWeight:600,color:t.text1,marginTop:6}}>{label}</div>
      {sub && <div style={{fontSize:12,color:t.text3,marginTop:2}}>{sub}</div>}
    </div>
  );
}

/* ─── PRODUCT GRID ────────────────────────────────────────────── */
function ProductGrid({ results, t }) {
  const byProd = {};
  results.forEach(r=>{
    const k=r.project;
    if(!byProd[k]) byProd[k]={runs:0,failRuns:0,steps:0,failSteps:0,lastRun:null,types:new Set(),builds:new Set()};
    const p=byProd[k];
    p.runs++;
    if(r.has_failure) p.failRuns++;
    p.steps    +=r.total_steps  ||0;
    p.failSteps+=r.failed_steps ||0;
    p.types.add(r.script_type);
    if(r.build_number) p.builds.add(r.build_number);
    if(!p.lastRun||new Date(r.timestamp)>new Date(p.lastRun)){
      p.lastRun=r.timestamp; p.lastBuild=r.build_number; p.cluster=r.cluster;
    }
  });

  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:16}}>
      {Object.entries(byProd).map(([name,d],i)=>{
        const rate=d.steps>0?(d.failSteps/d.steps)*100:0;
        const col=healthColor(rate,t);
        return (
          <div key={name} className="card fu" style={{padding:"20px",animationDelay:`${i*60}ms`,borderLeft:`3px solid ${col}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{flex:1,paddingRight:12}}>
                <div style={{fontSize:15,fontWeight:700,color:t.text0,marginBottom:6,lineHeight:1.3}}>{name}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {d.cluster&&<span className="badge badge-muted" style={{fontSize:12}}>{d.cluster}</span>}
                  {[...d.types].map(tp=><span key={tp} className="badge badge-info" style={{fontSize:11}}>{tp}</span>)}
                </div>
              </div>
              <Gauge failRate={rate} t={t} size={70}/>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[
                {l:"Runs",       v:d.runs,      c:t.accent},
                {l:"Failed runs",v:d.failRuns,  c:d.failRuns>0?t.danger:t.text3},
                {l:"Step fails", v:d.failSteps, c:d.failSteps>0?t.warn:t.text3},
              ].map(m=>(
                <div key={m.l} style={{background:t.bg2,borderRadius:8,padding:"10px 10px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:m.c,lineHeight:1,letterSpacing:"-0.02em"}}>{m.v}</div>
                  <div style={{fontSize:11,color:t.text3,marginTop:3,fontWeight:500}}>{m.l}</div>
                </div>
              ))}
            </div>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${t.border}`}}>
              <span style={{fontSize:12,color:t.text3}}>{d.lastRun?fmtTime(d.lastRun):"—"}</span>
              {d.lastBuild&&<span className="badge badge-gold" style={{fontSize:11}}>Build #{d.lastBuild}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── FAIL TABLE ──────────────────────────────────────────────── */
function FailTable({ summary, t }) {
  const [sort,setSort]=useState({k:"failures",d:"desc"});
  const rows=[...(summary?.by_step||[])].filter(s=>s.failures>0)
    .sort((a,b)=>{const av=a[sort.k],bv=b[sort.k];return sort.d==="desc"?bv-av:av-bv});
  const tog=k=>setSort(s=>({k,d:s.k===k&&s.d==="desc"?"asc":"desc"}));

  if(!rows.length) return (
    <div style={{textAlign:"center",padding:"56px 20px",color:t.text3}}>
      <div style={{fontSize:32,marginBottom:8}}>✓</div>
      <div style={{fontSize:15,fontWeight:600,color:t.success}}>All systems nominal</div>
      <div style={{fontSize:13,marginTop:4}}>No failures detected in the selected time range</div>
    </div>
  );

  const cols=[
    {k:"_id",             l:"Step Name"},
    {k:"failures",        l:"Failures"},
    {k:"total",           l:"Total Runs"},
    {k:"failure_rate",    l:"Failure Rate"},
    {k:"avg_response_time",l:"Avg Response"},
    {k:"last_run",        l:"Last Seen"},
  ];

  return (
    <div style={{overflowX:"auto"}}>
      <table>
        <thead>
          <tr>
            {cols.map(c=>(
              <th key={c.k} onClick={()=>tog(c.k)} style={{cursor:"pointer",userSelect:"none"}}>
                {c.l} {sort.k===c.k?(sort.d==="desc"?"↓":"↑"):""}
              </th>
            ))}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s,i)=>{
            const rate=parseFloat(s.failure_rate)||0;
            const col=healthColor(rate,t);
            return (
              <tr key={s._id} className="sr" style={{animationDelay:`${i*20}ms`}}>
                <td style={{maxWidth:280}}>
                  <span style={{fontWeight:600,color:t.text0,fontSize:14}}>{s._id}</span>
                </td>
                <td>
                  <span style={{fontSize:20,fontWeight:700,color:t.danger,letterSpacing:"-0.02em"}}>{s.failures}</span>
                </td>
                <td style={{color:t.text2}}>{s.total}</td>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:90,height:5,background:t.bg3,borderRadius:99,overflow:"hidden",flexShrink:0}}>
                      <div style={{
                        width:`${Math.min(rate,100)}%`,height:"100%",
                        background:col,borderRadius:99,
                        transition:"width 1s ease",
                      }}/>
                    </div>
                    <span style={{fontSize:13,color:col,fontWeight:600,minWidth:44,fontFamily:"'IBM Plex Mono',monospace"}}>
                      {fmtPct(rate)}
                    </span>
                  </div>
                </td>
                <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:t.text1}}>
                  {s.avg_response_time?.toFixed(2)}s
                </td>
                <td style={{fontSize:13,color:t.text3}}>{s.last_run?fmtTime(s.last_run):"—"}</td>
                <td>
                  <span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`}>
                    {rate===0?"Nominal":rate<20?"Degraded":"Critical"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── RUN HISTORY ─────────────────────────────────────────────── */
function RunHistory({ results, t }) {
  const [expanded,setExpanded]=useState(null);
  const [page,setPage]=useState(1);
  const PER=15;
  const pages=Math.ceil(results.length/PER);
  const visible=results.slice((page-1)*PER,page*PER);

  return (
    <div>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead>
            <tr>
              <th style={{width:24}}/>
              <th>Timestamp</th><th>Product</th><th>Cluster</th>
              <th>Script</th><th>Build</th><th>Steps</th>
              <th>Duration</th><th>Result</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r=>{
              const open=expanded===r._id;
              return [
                <tr key={r._id} onClick={()=>setExpanded(open?null:r._id)}
                  style={{
                    cursor:"pointer",
                    background:open?t.accentLight:undefined,
                  }}>
                  <td style={{textAlign:"center",color:t.text3,fontSize:12}}>
                    <span style={{
                      display:"inline-block",
                      transform:open?"rotate(90deg)":"none",
                      transition:"transform .2s",
                    }}>▶</span>
                  </td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:t.text2,whiteSpace:"nowrap"}}>
                    {fmtTime(r.timestamp)}
                  </td>
                  <td style={{fontWeight:600,color:t.text0,fontSize:14}}>{r.project}</td>
                  <td><span className="badge badge-muted" style={{fontSize:12}}>{r.cluster}</span></td>
                  <td><span className="badge badge-info" style={{fontSize:12}}>{r.script_type}</span></td>
                  <td>
                    <span className="badge badge-gold" style={{fontSize:12}}>
                      {r.build_number?`#${r.build_number}`:"—"}
                    </span>
                  </td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
                    <span style={{color:t.success,fontWeight:600}}>{r.passed_steps}✓</span>
                    {r.failed_steps>0&&<span style={{color:t.danger,fontWeight:600,marginLeft:8}}>{r.failed_steps}✗</span>}
                    <span style={{color:t.text3,marginLeft:6}}>/{r.total_steps}</span>
                  </td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:t.text2}}>{fmtDur(r.total_duration)}</td>
                  <td>
                    <span className={`badge ${r.has_failure?"badge-fail":"badge-ok"}`}>
                      {r.has_failure?"Failed":"Passed"}
                    </span>
                  </td>
                </tr>,
                open && (
                  <tr key={r._id+"-e"}>
                    <td colSpan={9} style={{padding:"0 16px 16px 56px",background:t.bg2}}>
                      <div style={{paddingTop:14}}>
                        <div style={{fontSize:13,fontWeight:600,color:t.text2,marginBottom:10}}>Step execution trace</div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {r.steps?.map((s,si)=>(
                            <div key={si} style={{
                              display:"flex",alignItems:"center",gap:14,
                              padding:"10px 14px",borderRadius:8,
                              background:!s.is_success?t.dangerBg:t.bg1,
                              border:`1px solid ${!s.is_success?`${t.danger}35`:t.border}`,
                            }}>
                              <span style={{fontSize:14,fontWeight:700,color:!s.is_success?t.danger:t.success,minWidth:16,textAlign:"center"}}>
                                {!s.is_success?"✗":"✓"}
                              </span>
                              <span style={{flex:1,fontSize:14,color:!s.is_success?t.text0:t.text1,fontWeight:!s.is_success?600:400}}>
                                {s.step}
                              </span>
                              <span style={{
                                fontFamily:"'IBM Plex Mono',monospace",fontSize:13,
                                color:statusColor(s.status_code,t),fontWeight:600,
                                minWidth:40,textAlign:"right",
                              }}>{s.status_code}</span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:t.text2,minWidth:60,textAlign:"right"}}>
                                {s.response_time?.toFixed(2)}s
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ].filter(Boolean);
            })}
          </tbody>
        </table>
      </div>
      {pages>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,padding:"16px",borderTop:`1px solid ${t.border}`}}>
          <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Previous</button>
          <span style={{fontSize:14,color:t.text2}}>Page {page} of {pages}</span>
          <button className="btn" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ─── STEP ANALYTICS ──────────────────────────────────────────── */
function StepAnalytics({ summary, t }) {
  const steps=[...(summary?.by_step||[])].sort((a,b)=>(b.failures||0)-(a.failures||0));
  if(!steps.length) return <div style={{padding:"40px",textAlign:"center",color:t.text3,fontSize:14}}>No step data yet.</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8,padding:"4px 0"}}>
      {steps.map((s,i)=>{
        const rate=parseFloat(s.failure_rate)||0;
        const col=healthColor(rate,t);
        return (
          <div key={s._id} className="fu" style={{
            display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",
            padding:"14px 20px",borderBottom:`1px solid ${t.border}`,
            animationDelay:`${i*25}ms`,
          }}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:14,fontWeight:600,color:t.text0,marginBottom:2}}>{s._id}</div>
              <div style={{fontSize:12,color:t.text3}}>Last run: {s.last_run?fmtTime(s.last_run):"—"}</div>
            </div>
            <div style={{display:"flex",gap:28,alignItems:"center",flexWrap:"wrap"}}>
              {[
                {l:"Total",v:s.total,    c:t.text1},
                {l:"Failures",v:s.failures, c:s.failures>0?t.danger:t.text3},
                {l:"Avg time",v:`${s.avg_response_time?.toFixed(2)}s`,c:t.info,mono:true},
              ].map(m=>(
                <div key={m.l} style={{textAlign:"center",minWidth:52}}>
                  <div style={{
                    fontSize:18,fontWeight:700,color:m.c,lineHeight:1,
                    fontFamily:m.mono?"'IBM Plex Mono',monospace":undefined,
                    letterSpacing:"-0.01em",
                  }}>{m.v}</div>
                  <div style={{fontSize:11,color:t.text3,marginTop:3,fontWeight:500}}>{m.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200}}>
              <div style={{flex:1,height:6,background:t.bg3,borderRadius:99,overflow:"hidden"}}>
                <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1.1s ease"}}/>
              </div>
              <span style={{fontSize:13,color:col,fontWeight:700,minWidth:44,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtPct(rate)}</span>
              <span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`} style={{fontSize:12}}>
                {rate===0?"OK":rate<20?"Warn":"Fail"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BUILD TRACKER ───────────────────────────────────────────── */
function BuildTracker({ results, t }) {
  const builds={};
  results.forEach(r=>{
    const b=r.build_number||"Unknown";
    if(!builds[b]) builds[b]={runs:0,fails:0,projects:new Set(),failedSteps:[],firstSeen:r.timestamp,lastSeen:r.timestamp};
    builds[b].runs++;
    if(r.has_failure){
      builds[b].fails++;
      r.steps?.filter(s=>!s.is_success).forEach(s=>builds[b].failedSteps.push({step:s.step,project:r.project}));
    }
    builds[b].projects.add(r.project);
    if(new Date(r.timestamp)>new Date(builds[b].lastSeen)) builds[b].lastSeen=r.timestamp;
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {Object.entries(builds).sort((a,b)=>new Date(b[1].lastSeen)-new Date(a[1].lastSeen)).map(([build,d],i)=>{
        const clean=d.fails===0;
        return (
          <div key={build} className="card fu" style={{
            padding:"18px 22px",animationDelay:`${i*50}ms`,
            borderLeft:`3px solid ${clean?t.success:t.danger}`,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{minWidth:110}}>
                <div style={{fontSize:12,color:t.text3,fontWeight:500,marginBottom:3}}>Build Number</div>
                <div style={{fontSize:22,fontWeight:700,color:t.gold,letterSpacing:"-0.02em",fontFamily:"'IBM Plex Mono',monospace"}}>
                  #{build}
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:5}}>
                  {[...d.projects].map(p=><span key={p} className="badge badge-info" style={{fontSize:12}}>{p}</span>)}
                </div>
                <div style={{fontSize:12,color:t.text3}}>
                  {fmtTime(d.firstSeen)} → {fmtTime(d.lastSeen)}
                </div>
              </div>
              <div style={{display:"flex",gap:28}}>
                {[
                  {l:"Runs",  v:d.runs,  c:t.accent},
                  {l:"Failed",v:d.fails, c:clean?t.text3:t.danger},
                ].map(m=>(
                  <div key={m.l} style={{textAlign:"center"}}>
                    <div style={{fontSize:24,fontWeight:700,color:m.c,lineHeight:1,letterSpacing:"-0.02em"}}>{m.v}</div>
                    <div style={{fontSize:12,color:t.text3,marginTop:3,fontWeight:500}}>{m.l}</div>
                  </div>
                ))}
              </div>
              <span className={`badge ${clean?"badge-ok":"badge-fail"}`} style={{fontSize:13}}>
                {clean?"Clean build":`${d.failedSteps.length} failure${d.failedSteps.length>1?"s":""}`}
              </span>
            </div>
            {d.failedSteps.length>0&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${t.border}`}}>
                <div style={{fontSize:13,fontWeight:600,color:t.text2,marginBottom:8}}>Failed steps in this build</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {[...new Map(d.failedSteps.map(s=>[s.step+s.project,s])).values()].map((s,si)=>(
                    <div key={si} style={{
                      fontSize:13,color:t.danger,background:t.dangerBg,
                      border:`1px solid ${t.danger}30`,borderRadius:6,padding:"4px 12px",
                    }}>
                      <span style={{color:t.text3,fontSize:12}}>{s.project} / </span>
                      {s.step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── OVERVIEW ────────────────────────────────────────────────── */
function Overview({ summary, results, t }) {
  const kpi=summary?.kpi||{};
  const spark7=(() => {
    const map={};
    results.forEach(r=>{const d=new Date(r.timestamp).toDateString();map[d]=(map[d]||0)+(r.failed_steps||0)});
    return Object.values(map).slice(-7);
  })();
  const sparkRuns=(() => {
    const map={};
    results.forEach(r=>{const d=new Date(r.timestamp).toDateString();map[d]=(map[d]||0)+1});
    return Object.values(map).slice(-7);
  })();
  const failRate=parseFloat(kpi.overall_failure_rate)||0;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
        {[
          {label:"Total Script Runs",   value:kpi.total_runs||0,          color:t.accent,  spark:sparkRuns, sub:"All products combined"},
          {label:"Failed Runs",         value:kpi.failed_runs||0,         color:t.danger,  spark:spark7,    sub:"Runs with failures"},
          {label:"Step Executions",     value:kpi.total_steps_run||0,     color:t.warn,    sub:"Total step checks"},
          {label:"Step Failures",       value:kpi.total_failures||0,      color:t.danger,  sub:"Individual step fails"},
          {label:"Failure Rate",        value:failRate,dec:1,suffix:"%",  color:healthColor(failRate,t), sub:"Overall health metric"},
          {label:"Avg Script Duration", value:kpi.avg_duration||0,dec:1,suffix:"s", color:t.info, sub:"Seconds per run"},
        ].map((c,i)=><KpiCard key={c.label} {...c} delay={i*55} t={t}/>)}
      </div>
      <Section title="Product Health" sub="Live status per product" t={t}>
        <div style={{padding:"20px"}}><ProductGrid results={results} t={t}/></div>
      </Section>
      <Section title="Active Failures" sub="Steps currently failing — sorted by impact" t={t}>
        <FailTable summary={summary} t={t}/>
      </Section>
    </div>
  );
}

/* ─── PAGE META ───────────────────────────────────────────────── */
const PAGES = {
  overview: {title:"Overview",         sub:"System-wide health metrics across all products"},
  failures: {title:"Failure Tracker",  sub:"All steps with recorded failures"},
  products: {title:"Products",         sub:"Per-product health breakdown"},
  runs:     {title:"Run History",      sub:"Full execution log — click any row to expand"},
  steps:    {title:"Step Analytics",   sub:"Failure rate and response time per step"},
  builds:   {title:"Build Tracker",    sub:"Trace failures to specific build numbers"},
};

/* ─── APP ─────────────────────────────────────────────────────── */
export default function App() {
  const [page,setPage]     = useState("overview");
  const [filters,setFilters] = useState({});
  const [data,setData]     = useState({results:[],summary:null,projects:[],clusters:[]});
  const [loading,setLoading] = useState(true);
  const [waking,setWaking]   = useState(false);
  const [error,setError]     = useState(null);
  const [lastUpdated,setLastUpdated] = useState(null);
  const [isDark,setDark]   = useState(true);
  const t = isDark ? dark : light;

  const buildQS = useCallback((extra={}) => {
    const p=new URLSearchParams();
    Object.entries({...filters,...extra}).forEach(([k,v])=>{if(v)p.set(k,v)});
    return p.toString();
  },[filters]);

  const fetchData = useCallback(async (isRetry=false) => {
    try {
      setError(null);
      if(isRetry) setWaking(true);
      const h={Authorization:`Bearer ${TOKEN}`};
      const [rR,sR,pR] = await Promise.all([
        fetchWithRetry(`${API_BASE}/api/results?${buildQS({limit:200})}`,{headers:h}),
        fetchWithRetry(`${API_BASE}/api/results/summary?${buildQS()}`,{headers:h}),
        fetchWithRetry(`${API_BASE}/api/results/projects`,{headers:h}),
      ]);
      const [rD,sD,pD] = await Promise.all([rR.json(),sR.json(),pR.json()]);
      setData({results:rD.results||[],summary:sD,projects:pD.projects||[],clusters:pD.clusters||[]});
      setLastUpdated(new Date());
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setWaking(false);
    }
  },[buildQS]);

  useEffect(()=>{
    fetchData();
    const iv=setInterval(fetchData,POLL_MS);
    return()=>clearInterval(iv);
  },[fetchData]);

  const failCount=data.results.filter(r=>r.has_failure).length;
  const meta=PAGES[page];

  return (
    <>
      <style>{makeCSS(t, isDark)}</style>
      <div style={{display:"flex",minHeight:"100vh",background:t.bg}}>
        <Sidebar active={page} set={setPage} failCount={failCount} t={t}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <Topbar
            lastUpdated={lastUpdated} loading={loading} onRefresh={()=>fetchData(true)}
            filters={filters} setFilters={setFilters}
            projects={data.projects} clusters={data.clusters}
            t={t} isDark={isDark} setDark={setDark}
          />
          <main style={{flex:1,padding:"28px 30px",overflow:"auto",maxWidth:1440}}>

            {/* Page header */}
            <div className="fu" style={{marginBottom:24}}>
              <h1 style={{fontSize:22,fontWeight:700,color:t.text0,letterSpacing:"-0.02em"}}>{meta.title}</h1>
              <p style={{fontSize:14,color:t.text3,marginTop:4}}>{meta.sub}</p>
            </div>

            {/* Wake-up banner */}
            {waking && <WakeBanner t={t}/>}

            {/* Error */}
            {error && !waking && (
              <div style={{
                background:t.dangerBg,border:`1px solid ${t.danger}40`,
                borderRadius:10,padding:"14px 18px",marginBottom:20,
                display:"flex",alignItems:"flex-start",gap:12,
              }}>
                <span style={{fontSize:18,marginTop:1}}>⚠</span>
                <div>
                  <div style={{fontSize:14,fontWeight:600,color:t.danger}}>Cannot reach API</div>
                  <div style={{fontSize:13,color:t.text2,marginTop:2}}>{error}</div>
                  <div style={{fontSize:13,color:t.text3,marginTop:4}}>
                    The server may be starting up. Retrying automatically — or click Refresh to retry now.
                  </div>
                </div>
                <button className="btn" onClick={()=>fetchData(true)} style={{marginLeft:"auto",flexShrink:0}}>
                  Retry now
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading ? (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
                  {Array.from({length:6}).map((_,i)=>(
                    <div key={i} className="card" style={{padding:"20px",height:110}}>
                      <div className="skeleton" style={{height:14,width:"50%",marginBottom:14}}/>
                      <div className="skeleton" style={{height:32,width:"60%",marginBottom:10}}/>
                      <div className="skeleton" style={{height:11,width:"70%"}}/>
                    </div>
                  ))}
                </div>
                <div className="card skeleton" style={{height:200}}/>
              </div>
            ) : (
              <>
                {page==="overview" && <Overview summary={data.summary} results={data.results} t={t}/>}
                {page==="failures" && (
                  <Section title="All Failure Events" sub={`${data.summary?.by_step?.filter(s=>s.failures>0).length||0} steps with recorded failures`} t={t}>
                    <FailTable summary={data.summary} t={t}/>
                  </Section>
                )}
                {page==="products" && (
                  <div className="fu"><ProductGrid results={data.results} t={t}/></div>
                )}
                {page==="runs" && (
                  <Section title="Execution Log" sub={`${data.results.length} total runs`} t={t}>
                    <RunHistory results={data.results} t={t}/>
                  </Section>
                )}
                {page==="steps" && (
                  <Section title="Step-Level Analytics" sub="Sorted by failure count" t={t}>
                    <StepAnalytics summary={data.summary} t={t}/>
                  </Section>
                )}
                {page==="builds" && (
                  <div className="fu"><BuildTracker results={data.results} t={t}/></div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}