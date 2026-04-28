import { useState, useEffect, useCallback, useRef, useMemo } from "react";

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "https://qa-monitor.onrender.com";
const TOKEN    = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_TOKEN) ;
const POLL_MS  = 30000;

/* ─── RETRY FETCH ─────────────────────────────────────────────── */
async function apiFetch(url, opts = {}, retries = 4) {
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(url, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      const connErr = ["Failed to fetch","ERR_CONNECTION","NetworkError","network","Load failed"]
        .some(s => e.message.includes(s));
      if (connErr && i < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, i + 1) * 1000));
        continue;
      }
      throw e;
    }
  }
}

/* ─── THEME TOKENS ────────────────────────────────────────────── */
const DARK = {
  mode:        "dark",
  pageBg:      "#080C14",
  cardBg:      "#0E1422",
  cardBg2:     "#131929",
  inputBg:     "#131929",
  sidebarBg:         "#060A10",
  sidebarBorder:     "rgba(255,255,255,0.05)",
  sidebarItem:       "rgba(255,255,255,0.04)",
  sidebarActiveText: "#FFFFFF",
  sidebarActiveBg:   "rgba(99,102,241,0.15)",
  sidebarActiveIcon: "#A5B4FC",
  sidebarActiveBar:  "#6366F1",
  sidebarText:       "rgba(255,255,255,0.62)",
  sidebarSub:        "rgba(255,255,255,0.30)",
  sidebarFooter:     "rgba(255,255,255,0.22)",
  sidebarLiveBg:     "rgba(52,211,153,0.08)",
  sidebarLiveBorder: "rgba(52,211,153,0.18)",
  sidebarLiveText:   "#6EE7B7",
  sidebarLiveDot:    "#34D399",
  border:      "rgba(255,255,255,0.07)",
  borderMid:   "rgba(255,255,255,0.12)",
  borderFocus: "#6366F1",
  t0:          "#F0F4FF",
  t1:          "#C4CDDF",
  t2:          "#8896AC",
  t3:          "#4E5C72",
  accent:      "#6366F1",
  accentBg:    "rgba(99,102,241,0.12)",
  accentHover: "#4F46E5",
  success:     "#34D399",
  successBg:   "rgba(52,211,153,0.10)",
  warn:        "#FBBF24",
  warnBg:      "rgba(251,191,36,0.10)",
  danger:      "#F87171",
  dangerBg:    "rgba(248,113,113,0.10)",
  info:        "#67E8F9",
  infoBg:      "rgba(103,232,249,0.08)",
  gold:        "#FCD34D",
  goldBg:      "rgba(252,211,77,0.10)",
  shadow:      "0 1px 4px rgba(0,0,0,0.6)",
  shadowMd:    "0 4px 20px rgba(0,0,0,0.7)",
  shadowLg:    "0 8px 40px rgba(0,0,0,0.8)",
};

const LIGHT = {
  mode:        "light",
  pageBg:      "#F0F2F8",
  cardBg:      "#FFFFFF",
  cardBg2:     "#F7F9FC",
  inputBg:     "#F0F2F8",
  sidebarBg:         "#FFFFFF",
  sidebarBorder:     "#E4E8F0",
  sidebarItem:       "rgba(99,102,241,0.06)",
  sidebarActiveText: "#1A1F36",
  sidebarActiveBg:   "rgba(99,102,241,0.09)",
  sidebarActiveIcon: "#4F46E5",
  sidebarActiveBar:  "#4F46E5",
  sidebarText:       "#3D4663",
  sidebarSub:        "#9CA3AF",
  sidebarFooter:     "#9CA3AF",
  sidebarLiveBg:     "rgba(5,150,105,0.06)",
  sidebarLiveBorder: "rgba(5,150,105,0.18)",
  sidebarLiveText:   "#059669",
  sidebarLiveDot:    "#10B981",
  border:      "#E4E8F0",
  borderMid:   "#CBD2DF",
  borderFocus: "#4F46E5",
  t0:          "#0D1220",
  t1:          "#1E2A3D",
  t2:          "#4A5568",
  t3:          "#6B7A94",
  accent:      "#4F46E5",
  accentBg:    "#EEF2FF",
  accentHover: "#3730A3",
  success:     "#059669",
  successBg:   "#ECFDF5",
  warn:        "#D97706",
  warnBg:      "#FFFBEB",
  danger:      "#DC2626",
  dangerBg:    "#FEF2F2",
  info:        "#0369A1",
  infoBg:      "#E0F2FE",
  gold:        "#92400E",
  goldBg:      "#FEF3C7",
  shadow:      "0 1px 3px rgba(13,18,32,0.07)",
  shadowMd:    "0 4px 14px rgba(13,18,32,0.09)",
  shadowLg:    "0 8px 28px rgba(13,18,32,0.11)",
};

/* ─── CSS FACTORY ─────────────────────────────────────────────── */
const makeCSS = (T) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:${T.pageBg};color:${T.t1};
  font-family:'Inter',system-ui,sans-serif;font-size:15px;
  line-height:1.6;-webkit-font-smoothing:antialiased;
  min-height:100vh;overflow-x:hidden;
  transition:background .3s,color .3s;
}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:99px}

/* ── KEYFRAMES ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes shimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
@keyframes logoReveal{from{opacity:0;transform:translateX(-16px) scale(.96)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes badgePop{from{opacity:0;transform:scale(.6) rotate(-6deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
@keyframes liveRipple{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.8);opacity:0}}
@keyframes countUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes borderPop{0%,100%{border-color:${T.danger}30}50%{border-color:${T.danger}70}}
@keyframes navItemIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes topbarIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@keyframes orbitSpin{from{transform:rotate(0deg) translateX(11px) rotate(0deg)}to{transform:rotate(360deg) translateX(11px) rotate(-360deg)}}
@keyframes dotPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}

.fu{animation:fadeUp .44s cubic-bezier(.22,1,.36,1) both}
.fi{animation:fadeIn .32s ease both}
.sr{animation:slideR .34s cubic-bezier(.22,1,.36,1) both}

/* ── CARDS ── */
.card{
  background:${T.cardBg};border:1px solid ${T.border};
  border-radius:16px;box-shadow:${T.shadow};
  transition:border-color .2s,box-shadow .2s;overflow:hidden;
}
.card:hover{border-color:${T.borderMid};box-shadow:${T.shadowMd}}

/* ── BUTTONS ── */
.btn{
  display:inline-flex;align-items:center;gap:7px;
  padding:9px 18px;border-radius:9px;border:1px solid ${T.border};
  background:${T.cardBg};color:${T.t1};
  font-family:'Inter',sans-serif;font-size:14px;font-weight:500;
  cursor:pointer;transition:all .16s;white-space:nowrap;
}
.btn:hover{background:${T.cardBg2};border-color:${T.borderMid};color:${T.t0};box-shadow:${T.shadow}}
.btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
.btn.primary{
  background:linear-gradient(135deg,${T.accent} 0%,${T.accentHover} 100%);
  border-color:transparent;color:#fff;font-weight:600;
  box-shadow:0 2px 12px ${T.accent}44;
}
.btn.primary:hover{
  background:linear-gradient(135deg,${T.accentHover} 0%,${T.accent} 100%);
  box-shadow:0 4px 18px ${T.accent}55;transform:translateY(-1px);
}
.btn.ghost{background:transparent;border-color:transparent;color:${T.t2}}
.btn.ghost:hover{background:${T.cardBg2};border-color:${T.border};color:${T.t0}}

/* ── BADGES ── */
.badge{
  display:inline-flex;align-items:center;padding:3px 10px;
  font-size:12px;font-weight:600;border-radius:6px;letter-spacing:.01em;
  font-family:'Inter',sans-serif;line-height:1.4;
}
.badge-ok   {background:${T.successBg};color:${T.success}}
.badge-fail {background:${T.dangerBg};color:${T.danger}}
.badge-warn {background:${T.warnBg};color:${T.warn}}
.badge-info {background:${T.infoBg};color:${T.info}}
.badge-gold {background:${T.goldBg};color:${T.gold}}
.badge-muted{background:${T.cardBg2};color:${T.t2};border:1px solid ${T.border}}

/* ── INPUTS ── */
input,select{
  background:${T.inputBg};border:1px solid ${T.border};border-radius:9px;
  color:${T.t0};font-family:'Inter',sans-serif;font-size:14px;
  padding:8px 12px;outline:none;
  transition:border-color .18s,box-shadow .18s,transform .15s;
  min-width:0;
}
input:hover,select:hover{border-color:${T.borderMid};transform:translateY(-1px)}
input:focus,select:focus{
  border-color:${T.borderFocus};
  box-shadow:0 0 0 3px ${T.accent}22;
  transform:translateY(-1px);
  background:${T.cardBg};
}
select option{background:${T.cardBg};color:${T.t0}}

/* ── TABLE ── */
table{border-collapse:collapse;width:100%}
th{
  color:${T.t2};font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  padding:11px 16px;border-bottom:1px solid ${T.border};
  text-align:left;white-space:nowrap;background:${T.cardBg2};
}
td{
  padding:13px 16px;border-bottom:1px solid ${T.border};
  font-size:14px;color:${T.t1};vertical-align:middle;
}
tr:last-child td{border-bottom:none}
tbody tr{transition:background .12s}
tbody tr:hover td{background:${T.cardBg2};color:${T.t0}}

/* ── SKELETON ── */
.skel{
  background:linear-gradient(90deg,${T.cardBg2} 25%,${T.border} 50%,${T.cardBg2} 75%);
  background-size:700px 100%;animation:shimmer 1.6s ease infinite;border-radius:8px;
}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .sidebar-full{display:none!important}
  .sidebar-rail{display:flex!important}
  .main-content{padding:16px!important}
  .kpi-grid{grid-template-columns:repeat(2,1fr)!important}
  .product-grid{grid-template-columns:1fr!important}
  .topbar-filters{flex-wrap:wrap!important;gap:6px!important}
  .hide-mobile{display:none!important}
}
@media(max-width:560px){
  .kpi-grid{grid-template-columns:1fr!important}
  .topbar-filters select,.topbar-filters input{min-width:120px!important;font-size:13px!important}
}
`;

/* ─── UTILS ───────────────────────────────────────────────────── */
const fmtTime = d => new Date(d).toLocaleString("en-IN",{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
const fmtDur  = s => s >= 60 ? `${(s/60).toFixed(1)} min` : `${(s||0).toFixed(1)}s`;
const fmtPct  = n => `${parseFloat(n||0).toFixed(1)}%`;
const healthC = (r, T) => { const v=parseFloat(r); if(v===0)return T.success; if(v<10)return T.info; if(v<30)return T.warn; return T.danger; };
const statusC = (code, T) => { const c=parseInt(code); if(c>=200&&c<300)return T.success; if(c>=400&&c<500)return T.warn; return T.danger; };

/* ─── ANIMATED COUNTER ────────────────────────────────────────── */
function Counter({ to, dec=0, suffix="" }) {
  const [v,setV] = useState(0);
  const raf=useRef(); const prev=useRef(0);
  useEffect(()=>{
    const target=parseFloat(to)||0, from=prev.current;
    prev.current=target;
    const t0=Date.now(), dur=800;
    const tick=()=>{ const p=Math.min((Date.now()-t0)/dur,1), e=1-Math.pow(1-p,3); setV(from+(target-from)*e); if(p<1) raf.current=requestAnimationFrame(tick); };
    raf.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf.current);
  },[to]);
  return <>{dec ? v.toFixed(dec) : Math.round(v).toLocaleString()}{suffix}</>;
}

/* ─── SPARKLINE ───────────────────────────────────────────────── */
function Spark({ data=[], color, w=72, h=32 }) {
  if(!data||data.length<2) return <div style={{width:w,height:h}}/>;
  const max=Math.max(...data,1);
  const pts=data.map((v,i)=>({x:(i/(data.length-1))*w, y:h-4-(v/max)*(h-8)}));
  const line=pts.map(p=>`${p.x},${p.y}`).join(" ");
  const id=`sg${color.replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible",flexShrink:0}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`}/>
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.6" fill={color}/>
    </svg>
  );
}

/* ─── GAUGE ───────────────────────────────────────────────────── */
function Gauge({ failRate=0, T, size=70 }) {
  const r=26, circ=2*Math.PI*r, health=100-Math.min(parseFloat(failRate)||0,100), col=healthC(failRate,T);
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" style={{flexShrink:0}}>
      <circle cx="36" cy="36" r={r} fill="none" stroke={T.border} strokeWidth="5"/>
      <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="5"
        strokeDasharray={`${circ*(health/100)} ${circ*(1-health/100)}`} strokeLinecap="round"
        transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1)",filter:`drop-shadow(0 0 4px ${col}66)`}}/>
      <text x="36" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={col} fontFamily="Inter,sans-serif">{Math.round(health)}%</text>
      <text x="36" y="47" textAnchor="middle" fontSize="9" fill={T.t3} fontFamily="Inter,sans-serif">HEALTH</text>
    </svg>
  );
}

/* ─── WAKE BANNER ─────────────────────────────────────────────── */
function WakeBanner({ T }) {
  const [p,setP]=useState(0);
  useEffect(()=>{ const iv=setInterval(()=>setP(x=>Math.min(x+2,92)),700); return()=>clearInterval(iv); },[]);
  return (
    <div className="card" style={{padding:"16px 20px",marginBottom:20,border:`1px solid ${T.accent}44`,background:T.infoBg}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:T.info,animation:"pulse 1.2s ease infinite"}}/>
        <span style={{fontSize:15,fontWeight:600,color:T.info}}>Server is waking up — retrying automatically</span>
      </div>
      <div style={{background:T.border,borderRadius:99,height:4,overflow:"hidden",marginBottom:8}}>
        <div style={{width:`${p}%`,height:"100%",background:T.accent,borderRadius:99,transition:"width .7s ease"}}/>
      </div>
      <p style={{fontSize:13,color:T.t2,lineHeight:1.5}}>
        Render free tier spins down after 15 min of inactivity. Cold start takes ~30 seconds. Hang tight.
      </p>
    </div>
  );
}

/* ─── ANIMATED ARC LOGO ICON ──────────────────────────────────── */
function ArcLogoIcon({ size=46, animate=false }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:13, flexShrink:0, position:"relative",
      background:"linear-gradient(145deg,#6366F1 0%,#4F46E5 45%,#3730A3 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow:"0 4px 20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
      animation: animate ? "badgePop .55s cubic-bezier(.34,1.56,.64,1) .1s both" : undefined,
    }}>
      {/* Subtle top-left highlight */}
      <div style={{
        position:"absolute", top:3, left:3, width:18, height:18,
        borderRadius:"50%",
        background:"radial-gradient(circle at 30% 30%, rgba(255,255,255,0.22), transparent 70%)",
        pointerEvents:"none",
      }}/>
      {/* Orbiting dot */}
      <div style={{
        position:"absolute", width:"100%", height:"100%",
        display:"flex", alignItems:"center", justifyContent:"center",
        animation:"orbitSpin 3.5s linear infinite",
      }}>
        <div style={{
          width:5, height:5, borderRadius:"50%",
          background:"rgba(255,255,255,0.55)",
          boxShadow:"0 0 6px rgba(255,255,255,0.8)",
          marginTop:-size*0.28,
        }}/>
      </div>
      <span style={{
        fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:Math.round(size*0.34),
        color:"#fff", letterSpacing:"-0.04em", position:"relative", zIndex:1,
      }}>ARC</span>
    </div>
  );
}

/* ─── LOGO ────────────────────────────────────────────────────── */
function SidebarLogo({ T }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDark = T.mode === "dark";

  return (
    <div style={{padding:"20px 18px 16px", borderBottom:`1px solid ${T.sidebarBorder}`}}>
      {/* Main logo row */}
      <div
        onClick={()=>{ setPressed(true); setTimeout(()=>setPressed(false),350); }}
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        style={{
          display:"flex", alignItems:"center", gap:12, marginBottom:14,
          animation:"logoReveal .6s cubic-bezier(.22,1,.36,1) both",
          cursor:"pointer",
          transform: pressed ? "scale(0.95)" : hovered ? "scale(1.01)" : "scale(1)",
          transition:"transform .22s cubic-bezier(.34,1.56,.64,1)",
        }}>
        <ArcLogoIcon size={46} animate />

        {/* Text stack */}
        <div style={{animation:"logoReveal .55s cubic-bezier(.22,1,.36,1) .18s both", opacity:0, animationFillMode:"forwards"}}>
          {/* Product name */}
          <div style={{display:"flex", alignItems:"baseline", gap:5}}>
            <span style={{
              fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:17,
              color: isDark ? "#F0F4FF" : "#0D1220",
              letterSpacing:"-0.03em", lineHeight:1.1,
            }}>Document</span>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:3, marginTop:1}}>
            <span style={{
              fontFamily:"'Inter',sans-serif", fontWeight:400, fontSize:14.5,
              color: isDark ? "rgba(255,255,255,0.50)" : "#5B6880",
              letterSpacing:"-0.01em", lineHeight:1.1,
            }}>Solutions</span>
            {/* Tiny version pill */}
            <span style={{
              fontSize:10, fontWeight:700, letterSpacing:".04em",
              background: isDark ? "rgba(99,102,241,0.22)" : "rgba(79,70,229,0.10)",
              color: isDark ? "#A5B4FC" : "#4F46E5",
              borderRadius:5, padding:"1px 6px", lineHeight:1.6,
            }}>Pvt. Ltd.</span>
          </div>
        </div>
      </div>

      {/* Thin divider */}
      <div style={{height:"0.5px", background:T.sidebarBorder, marginBottom:12}}/>

      {/* Live status pill */}
      <div style={{
        display:"flex", alignItems:"center", gap:9, padding:"7px 11px",
        background:T.sidebarLiveBg, borderRadius:9,
        border:`1px solid ${T.sidebarLiveBorder}`,
        transition:"all .2s",
      }}>
        <div style={{position:"relative", flexShrink:0}}>
          <div style={{
            width:7, height:7, borderRadius:"50%",
            background:T.sidebarLiveDot,
            animation:"dotPulse 2s ease-in-out infinite",
          }}/>
          <div style={{
            position:"absolute", inset:-3, borderRadius:"50%",
            border:`1.5px solid ${T.sidebarLiveDot}`,
            animation:"liveRipple 2.2s ease-out infinite",
          }}/>
        </div>
        <span style={{fontSize:12.5, color:T.sidebarLiveText, fontWeight:600, letterSpacing:".02em"}}>QA Monitor</span>
        <span style={{marginLeft:"auto", fontSize:11, color:T.sidebarLiveText, opacity:.7, fontWeight:500}}>LIVE</span>
      </div>
    </div>
  );
}

/* ─── SIDEBAR ─────────────────────────────────────────────────── */
const NAV=[
  {id:"overview", label:"Overview",        sub:"System health",     icon:<OverviewIcon/>},
  {id:"failures", label:"Failure Tracker", sub:"Failed steps",      icon:<FailIcon/>},
  {id:"products", label:"Products",        sub:"Per-product view",  icon:<ProductIcon/>},
  {id:"runs",     label:"Run History",     sub:"Execution log",     icon:<RunIcon/>},
  {id:"steps",    label:"Step Analytics",  sub:"Step breakdown",    icon:<StepIcon/>},
  {id:"builds",   label:"Build Tracker",   sub:"Build diagnostics", icon:<BuildIcon/>},
];

/* ─── SVG NAV ICONS ───────────────────────────────────────────── */
function OverviewIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function FailIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r=".75" fill="currentColor"/></svg>;
}
function ProductIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5L8 2L14 5V11L8 14L2 11V5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 2V14M2 5L8 8L14 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
}
function RunIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5V8.5L10.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function StepIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="2" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="2" y1="12" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function BuildIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="8" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="6" y="5" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="10" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>;
}

function Sidebar({ active, set, failCount, T, mobileOpen, setMobileOpen }) {
  const navBody = (
    <nav style={{flex:1, padding:"10px 10px", display:"flex", flexDirection:"column", gap:2, overflow:"auto"}}>
      {/* Section label */}
      <div style={{fontSize:10.5, fontWeight:700, letterSpacing:".09em", color:T.sidebarSub, padding:"4px 14px 8px", textTransform:"uppercase"}}>Navigation</div>

      {NAV.map(({id,label,sub,icon},idx)=>{
        const on=active===id;
        return (
          <button key={id} onClick={()=>{set(id);setMobileOpen&&setMobileOpen(false);}} style={{
            display:"flex", alignItems:"center", gap:11, padding:"10px 13px",
            borderRadius:10, border:"none", cursor:"pointer", textAlign:"left", width:"100%",
            background: on ? T.sidebarActiveBg : "transparent",
            position:"relative", overflow:"hidden",
            transition:"background .18s, transform .1s",
            animation:`navItemIn .35s cubic-bezier(.22,1,.36,1) ${idx*45}ms both`,
          }}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
          onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
          onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
          >
            {/* Active left bar */}
            {on && <div style={{
              position:"absolute", left:0, top:"50%", transform:"translateY(-50%)",
              width:3, height:18, borderRadius:"0 3px 3px 0",
              background:T.sidebarActiveBar,
              boxShadow:`0 0 10px ${T.sidebarActiveBar}88`,
            }}/>}
            <span style={{
              color: on ? T.sidebarActiveIcon : T.sidebarSub,
              transition:"color .18s", flexShrink:0, display:"flex",
            }}>{icon}</span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{
                fontSize:14, fontWeight: on ? 600 : 500,
                color: on ? T.sidebarActiveText : T.sidebarText,
                display:"flex", alignItems:"center", gap:8,
                transition:"color .18s", letterSpacing:"-0.01em",
              }}>
                {label}
                {id==="failures"&&failCount>0&&(
                  <span style={{
                    background:"#EF4444", color:"#fff", borderRadius:99,
                    fontSize:10.5, fontWeight:700, padding:"1px 6px", lineHeight:1.5,
                    animation:"pulse 2.2s ease infinite",
                    boxShadow:"0 2px 8px rgba(239,68,68,0.4)",
                  }}>{failCount}</span>
                )}
              </div>
              <div style={{fontSize:11.5, color:T.sidebarSub, marginTop:1.5, fontWeight:400, letterSpacing:".005em"}}>{sub}</div>
            </div>
          </button>
        );
      })}
    </nav>
  );

  const footer=(
    <div style={{padding:"14px 18px", borderTop:`1px solid ${T.sidebarBorder}`}}>
      <div style={{
        display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
        borderRadius:8, background:T.sidebarItem,
      }}>
        <div style={{
          width:28, height:28, borderRadius:8, flexShrink:0,
          background:"linear-gradient(135deg,#6366F1,#3730A3)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#fff" strokeWidth="1.4"/><path d="M6.5 4V6.5L8 8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:12, fontWeight:600, color:T.sidebarText}}>Auto-polling</div>
          <div style={{fontSize:11, color:T.sidebarSub}}>Every 30 seconds</div>
        </div>
        <div style={{width:6, height:6, borderRadius:"50%", background:T.sidebarLiveDot, flexShrink:0, animation:"dotPulse 2s ease-in-out infinite"}}/>
      </div>
    </div>
  );

  return (
    <>
      {/* Full sidebar */}
      <aside className="sidebar-full" style={{
        width:236, flexShrink:0, background:T.sidebarBg,
        borderRight:`1px solid ${T.sidebarBorder}`,
        display:"flex", flexDirection:"column",
        height:"100vh", position:"sticky", top:0, zIndex:30,
      }}>
        <SidebarLogo T={T}/>
        {navBody}
        {footer}
      </aside>

      {/* Rail sidebar — mobile */}
      <aside className="sidebar-rail" style={{
        width:56, flexShrink:0, background:T.sidebarBg,
        borderRight:`1px solid ${T.sidebarBorder}`,
        display:"none", flexDirection:"column", alignItems:"center",
        height:"100vh", position:"sticky", top:0, zIndex:30, paddingTop:14, gap:2,
      }}>
        <ArcLogoIcon size={34}/>
        <div style={{height:8}}/>
        {NAV.map(({id,label,icon})=>{
          const on=active===id;
          return (
            <button key={id} title={label} onClick={()=>set(id)} style={{
              width:40, height:40, borderRadius:9, border:"none", cursor:"pointer",
              background:on?T.sidebarActiveBg:"transparent",
              color:on?T.sidebarActiveIcon:T.sidebarSub,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .16s", position:"relative",
            }}>
              {icon}
              {id==="failures"&&failCount>0&&(
                <span style={{position:"absolute",top:4,right:4,width:7,height:7,background:"#EF4444",borderRadius:"50%"}}/>
              )}
            </button>
          );
        })}
      </aside>
    </>
  );
}

/* ─── TOPBAR ──────────────────────────────────────────────────── */
function Topbar({ lastUpdated, loading, onRefresh, filters, setFilters, projects, clusters, T, isDark, setDark }) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <header style={{
      minHeight:60, borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center", padding:"0 22px", gap:12,
      background: isDark ? `rgba(8,12,20,0.92)` : `rgba(255,255,255,0.92)`,
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      position:"sticky", top:0, zIndex:10, flexShrink:0, flexWrap:"wrap",
      animation:"topbarIn .4s cubic-bezier(.22,1,.36,1) both",
    }}>

      {/* Filter strip */}
      <div className="topbar-filters" style={{
        flex:1, display:"flex", alignItems:"center", gap:7,
        flexWrap:"nowrap", overflow:"hidden", minWidth:0, padding:"7px 0",
      }}>
        {/* Filter icon */}
        <div style={{
          width:32, height:32, borderRadius:8, flexShrink:0,
          background:hasFilters?T.accentBg:T.cardBg2,
          border:`1px solid ${hasFilters?T.accent+"44":T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .2s",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 3.5H12.5M3.5 7H10.5M5.5 10.5H8.5" stroke={hasFilters?T.accent:T.t3} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {[
          ["project",     "All products",  projects.map(p=>({v:p,l:p}))],
          ["cluster",     "All clusters",  clusters.map(c=>({v:c,l:c}))],
          ["script_type", "All scripts",   [{v:"5min",l:"5 min"},{v:"30min",l:"30 min"}]],
          ["status",      "All statuses",  [{v:"failed",l:"Failures only"},{v:"passed",l:"Passed only"}]],
        ].map(([key,ph,opts])=>(
          <select
            key={key}
            value={filters[key]||""}
            onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))}
            style={{
              minWidth:130, flex:"0 0 auto",
              background: filters[key] ? (isDark?"rgba(99,102,241,0.14)":"rgba(79,70,229,0.07)") : T.inputBg,
              borderColor: filters[key] ? T.accent+"66" : T.border,
              color: filters[key] ? T.accent : T.t1,
              fontWeight: filters[key] ? 500 : 400,
            }}>
            <option value="">{ph}</option>
            {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}

        <input className="hide-mobile" type="date" value={filters.from||""} onChange={e=>setFilters(f=>({...f,from:e.target.value}))} style={{width:138,flex:"0 0 auto"}}/>
        <input className="hide-mobile" type="date" value={filters.to||""}   onChange={e=>setFilters(f=>({...f,to:e.target.value}))}   style={{width:138,flex:"0 0 auto"}}/>

        {hasFilters&&(
          <button className="btn ghost" onClick={()=>setFilters({})} style={{
            fontSize:13, flexShrink:0, color:T.danger,
            border:`1px solid ${T.danger}33`,
            background:T.dangerBg,
          }}>Clear ×</button>
        )}
      </div>

      {/* Right actions */}
      <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
        {lastUpdated&&(
          <div className="hide-mobile" style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"5px 10px", borderRadius:7,
            background:T.cardBg2, border:`1px solid ${T.border}`,
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke={T.t3} strokeWidth="1.3"/>
              <path d="M6 3.5V6L7.5 7.5" stroke={T.t3} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span style={{fontSize:12.5, color:T.t3, whiteSpace:"nowrap", fontVariantNumeric:"tabular-nums"}}>
              {fmtTime(lastUpdated)}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button className="btn ghost" onClick={()=>setDark(d=>!d)} title="Toggle theme" style={{
          padding:"8px 10px", fontSize:16,
          border:`1px solid ${T.border}`,
          borderRadius:9,
        }}>
          {isDark
            ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 1V2.5M8 13.5V15M1 8H2.5M13.5 8H15M3.05 3.05L4.11 4.11M11.89 11.89L12.95 12.95M3.05 12.95L4.11 11.89M11.89 4.11L12.95 3.05" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 9.5A6 6 0 016.5 2.5a6 6 0 100 11 6 6 0 007-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
          }
        </button>

        {/* Refresh */}
        <button className="btn primary" onClick={onRefresh} style={{gap:6}}>
          <span style={loading?{display:"inline-block",animation:"spin .65s linear infinite"}:{}}
            dangerouslySetInnerHTML={{__html:`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.5 7A5.5 5.5 0 012.5 7" stroke="white" strokeWidth="1.6" strokeLinecap="round"/><path d="M10 2.5L12.5 5 15 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>`}}
          />
          Refresh
        </button>
      </div>
    </header>
  );
}

/* ─── SECTION ─────────────────────────────────────────────────── */
function Section({ title, sub, children, T, action }) {
  return (
    <div className="card">
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"16px 22px", borderBottom:`1px solid ${T.border}`,
        background:T.cardBg2, gap:12, flexWrap:"wrap",
      }}>
        <div>
          <div style={{fontSize:15.5, fontWeight:700, color:T.t0, letterSpacing:"-0.01em"}}>{title}</div>
          {sub&&<div style={{fontSize:13, color:T.t3, marginTop:2}}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── KPI CARD ────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, spark, delay=0, dec=0, suffix="", T }) {
  return (
    <div className="card fu" style={{
      padding:"20px 22px", animationDelay:`${delay}ms`,
      borderTop:`2.5px solid ${color}`,
      position:"relative", overflow:"hidden",
    }}>
      {/* Subtle color wash */}
      <div style={{
        position:"absolute", top:0, right:0, width:80, height:80,
        background:`radial-gradient(circle at top right, ${color}12, transparent 70%)`,
        pointerEvents:"none",
      }}/>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
        <div style={{
          width:36, height:36, borderRadius:9,
          background:`${color}18`,
          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          border:`1px solid ${color}25`,
        }}>
          <div style={{width:10, height:10, borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}88`}}/>
        </div>
        {spark&&<Spark data={spark} color={color}/>}
      </div>
      <div style={{
        fontSize:32, fontWeight:700, color:T.t0, lineHeight:1,
        letterSpacing:"-0.04em",
        animation:"countUp .5s ease both", animationDelay:`${delay+120}ms`,
        fontVariantNumeric:"tabular-nums",
      }}>
        <span style={{color}}><Counter to={value} dec={dec} suffix={suffix}/></span>
      </div>
      <div style={{fontSize:14, fontWeight:600, color:T.t1, marginTop:7}}>{label}</div>
      {sub&&<div style={{fontSize:12.5, color:T.t2, marginTop:2}}>{sub}</div>}
    </div>
  );
}

/* ─── PRODUCT GRID ────────────────────────────────────────────── */
function ProductGrid({ results, T }) {
  const m={};
  results.forEach(r=>{
    const k=r.project;
    if(!m[k]) m[k]={runs:0,failRuns:0,steps:0,failSteps:0,lastRun:null,types:new Set()};
    const p=m[k]; p.runs++; if(r.has_failure)p.failRuns++;
    p.steps+=r.total_steps||0; p.failSteps+=r.failed_steps||0;
    p.types.add(r.script_type);
    if(!p.lastRun||new Date(r.timestamp)>new Date(p.lastRun)){p.lastRun=r.timestamp;p.lastBuild=r.build_number;p.cluster=r.cluster;}
  });
  return (
    <div className="product-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
      {Object.entries(m).map(([name,d],i)=>{
        const rate=d.steps>0?(d.failSteps/d.steps)*100:0, col=healthC(rate,T);
        return (
          <div key={name} className="card fu" style={{padding:"20px",animationDelay:`${i*55}ms`,borderLeft:`3px solid ${col}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{flex:1,paddingRight:12}}>
                <div style={{fontSize:15,fontWeight:700,color:T.t0,marginBottom:7,lineHeight:1.3}}>{name}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {d.cluster&&<span className="badge badge-muted">{d.cluster}</span>}
                  {[...d.types].map(tp=><span key={tp} className="badge badge-info">{tp}</span>)}
                </div>
              </div>
              <Gauge failRate={rate} T={T} size={68}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
              {[
                {l:"Runs",      v:d.runs,      c:T.accent},
                {l:"Failed",    v:d.failRuns,  c:d.failRuns>0?T.danger:T.t3},
                {l:"Step fails",v:d.failSteps, c:d.failSteps>0?T.warn:T.t3},
              ].map(x=>(
                <div key={x.l} style={{background:T.cardBg2,borderRadius:9,padding:"10px",border:`1px solid ${T.border}`}}>
                  <div style={{fontSize:22,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.02em"}}>{x.v}</div>
                  <div style={{fontSize:11,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${T.border}`}}>
              <span style={{fontSize:13,color:T.t3}}>{d.lastRun?fmtTime(d.lastRun):"—"}</span>
              {d.lastBuild&&<span className="badge badge-gold">Build #{d.lastBuild}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── FAIL TABLE ──────────────────────────────────────────────── */
function FailTable({ summary, T }) {
  const [sort,setSort]=useState({k:"failures",d:"desc"});
  const rows=[...(summary?.by_step||[])].filter(s=>s.failures>0).sort((a,b)=>{const av=a[sort.k],bv=b[sort.k];return sort.d==="desc"?bv-av:av-bv;});
  const tog=k=>setSort(s=>({k,d:s.k===k&&s.d==="desc"?"asc":"desc"}));
  if(!rows.length) return (
    <div style={{textAlign:"center",padding:"52px 20px",color:T.t3}}>
      <div style={{fontSize:34,marginBottom:8}}>✓</div>
      <div style={{fontSize:16,fontWeight:600,color:T.success}}>All systems nominal</div>
      <div style={{fontSize:14,color:T.t2,marginTop:4}}>No failures in the selected time range</div>
    </div>
  );
  const cols=[{k:"_id",l:"Step Name"},{k:"failures",l:"Failures"},{k:"total",l:"Runs"},{k:"failure_rate",l:"Failure Rate"},{k:"avg_response_time",l:"Avg Response"},{k:"last_run",l:"Last Seen"}];
  return (
    <div style={{overflowX:"auto"}}>
      <table>
        <thead><tr>{cols.map(c=><th key={c.k} onClick={()=>tog(c.k)} style={{cursor:"pointer",userSelect:"none"}}>{c.l}{sort.k===c.k?(sort.d==="desc"?" ↓":" ↑"):""}</th>)}<th>Status</th></tr></thead>
        <tbody>
          {rows.map((s,i)=>{
            const rate=parseFloat(s.failure_rate)||0, col=healthC(rate,T);
            return (
              <tr key={s._id} className="sr" style={{animationDelay:`${i*18}ms`}}>
                <td style={{maxWidth:280,minWidth:160}}><span style={{fontWeight:600,color:T.t0,fontSize:14}}>{s._id}</span></td>
                <td><span style={{fontSize:21,fontWeight:700,color:T.danger,letterSpacing:"-0.02em"}}>{s.failures}</span></td>
                <td style={{color:T.t2,fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>{s.total}</td>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:88,height:5,background:T.cardBg2,borderRadius:99,overflow:"hidden",flexShrink:0}}>
                      <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1s ease"}}/>
                    </div>
                    <span style={{fontSize:13,color:col,fontWeight:700,minWidth:42,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtPct(rate)}</span>
                  </div>
                </td>
                <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t1}}>{s.avg_response_time?.toFixed(2)}s</td>
                <td style={{fontSize:13,color:T.t2,whiteSpace:"nowrap"}}>{s.last_run?fmtTime(s.last_run):"—"}</td>
                <td><span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`}>{rate===0?"Nominal":rate<20?"Degraded":"Critical"}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── RUN HISTORY ─────────────────────────────────────────────── */
function RunHistory({ results, T }) {
  const [exp,setExp]=useState(null);
  const [page,setPage]=useState(1);
  const PER=15, pages=Math.ceil(results.length/PER);
  const visible=results.slice((page-1)*PER,page*PER);
  return (
    <div>
      <div style={{overflowX:"auto"}}>
        <table>
          <thead><tr><th style={{width:24}}/><th>Timestamp</th><th>Product</th><th className="hide-mobile">Cluster</th><th>Script</th><th>Build</th><th>Steps</th><th className="hide-mobile">Duration</th><th>Result</th></tr></thead>
          <tbody>
            {visible.map(r=>{
              const open=exp===r._id;
              return [
                <tr key={r._id} onClick={()=>setExp(open?null:r._id)} style={{cursor:"pointer",background:open?T.accentBg:undefined}}>
                  <td style={{textAlign:"center",color:T.t3,fontSize:12}}>
                    <span style={{display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
                  </td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2,whiteSpace:"nowrap"}}>{fmtTime(r.timestamp)}</td>
                  <td style={{fontWeight:600,color:T.t0,fontSize:14}}>{r.project}</td>
                  <td className="hide-mobile"><span className="badge badge-muted">{r.cluster}</span></td>
                  <td><span className="badge badge-info">{r.script_type}</span></td>
                  <td><span className="badge badge-gold">{r.build_number?`#${r.build_number}`:"—"}</span></td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,whiteSpace:"nowrap"}}>
                    <span style={{color:T.success,fontWeight:600}}>{r.passed_steps}✓</span>
                    {r.failed_steps>0&&<span style={{color:T.danger,fontWeight:600,marginLeft:7}}>{r.failed_steps}✗</span>}
                    <span style={{color:T.t3,marginLeft:5}}>/{r.total_steps}</span>
                  </td>
                  <td className="hide-mobile" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2}}>{fmtDur(r.total_duration)}</td>
                  <td><span className={`badge ${r.has_failure?"badge-fail":"badge-ok"}`}>{r.has_failure?"Failed":"Passed"}</span></td>
                </tr>,
                open&&(
                  <tr key={r._id+"-e"}>
                    <td colSpan={9} style={{padding:"0 16px 16px 52px",background:T.cardBg2}}>
                      <div style={{paddingTop:14}}>
                        <div style={{fontSize:13,fontWeight:600,color:T.t2,marginBottom:10}}>Step execution trace</div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {r.steps?.map((s,si)=>(
                            <div key={si} style={{
                              display:"flex",alignItems:"center",gap:13,padding:"11px 14px",borderRadius:9,
                              background:!s.is_success?T.dangerBg:T.cardBg,
                              border:`1px solid ${!s.is_success?T.danger+"40":T.border}`,
                              animation:!s.is_success?"borderPop 3s ease infinite":undefined,
                            }}>
                              <span style={{fontSize:15,fontWeight:700,color:!s.is_success?T.danger:T.success,minWidth:18,textAlign:"center"}}>{!s.is_success?"✗":"✓"}</span>
                              <span style={{flex:1,fontSize:14,color:!s.is_success?T.t0:T.t1,fontWeight:!s.is_success?600:400}}>{s.step}</span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:statusC(s.status_code,T),fontWeight:600,flexShrink:0}}>{s.status_code}</span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2,minWidth:58,textAlign:"right",flexShrink:0}}>{s.response_time?.toFixed(2)}s</span>
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
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,padding:"16px",borderTop:`1px solid ${T.border}`}}>
          <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
          <span style={{fontSize:14,color:T.t2,fontFamily:"'IBM Plex Mono',monospace"}}>Page {page} / {pages}</span>
          <button className="btn" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ─── STEP ANALYTICS ──────────────────────────────────────────── */
function StepAnalytics({ summary, T }) {
  const steps=[...(summary?.by_step||[])].sort((a,b)=>(b.failures||0)-(a.failures||0));
  if(!steps.length) return <div style={{padding:"44px",textAlign:"center",color:T.t2,fontSize:14}}>No step data available.</div>;
  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      {steps.map((s,i)=>{
        const rate=parseFloat(s.failure_rate)||0, col=healthC(rate,T);
        return (
          <div key={s._id} className="fu" style={{
            display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",
            padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
            animationDelay:`${i*22}ms`,
          }}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:14,fontWeight:600,color:T.t0,marginBottom:2}}>{s._id}</div>
              <div style={{fontSize:13,color:T.t3}}>Last: {s.last_run?fmtTime(s.last_run):"—"}</div>
            </div>
            <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
              {[{l:"Total",v:s.total,c:T.t1},{l:"Failures",v:s.failures,c:s.failures>0?T.danger:T.t3},{l:"Avg time",v:`${s.avg_response_time?.toFixed(2)}s`,c:T.info,mono:true}].map(x=>(
                <div key={x.l} style={{textAlign:"center",minWidth:52}}>
                  <div style={{fontSize:19,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.01em",fontFamily:x.mono?"'IBM Plex Mono',monospace":undefined}}>{x.v}</div>
                  <div style={{fontSize:11,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200}}>
              <div style={{flex:1,height:5,background:T.cardBg2,borderRadius:99,overflow:"hidden"}}>
                <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1.1s ease"}}/>
              </div>
              <span style={{fontSize:13,color:col,fontWeight:700,minWidth:44,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtPct(rate)}</span>
              <span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`} style={{fontSize:12}}>{rate===0?"OK":rate<20?"Warn":"Fail"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── BUILD TRACKER ───────────────────────────────────────────── */
function BuildTracker({ results, T }) {
  const builds={};
  results.forEach(r=>{
    const b=r.build_number||"Unknown";
    if(!builds[b]) builds[b]={runs:0,fails:0,projects:new Set(),failedSteps:[],firstSeen:r.timestamp,lastSeen:r.timestamp};
    builds[b].runs++; if(r.has_failure){builds[b].fails++; r.steps?.filter(s=>!s.is_success).forEach(s=>builds[b].failedSteps.push({step:s.step,project:r.project}));}
    builds[b].projects.add(r.project);
    if(new Date(r.timestamp)>new Date(builds[b].lastSeen)) builds[b].lastSeen=r.timestamp;
  });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {Object.entries(builds).sort((a,b)=>new Date(b[1].lastSeen)-new Date(a[1].lastSeen)).map(([build,d],i)=>{
        const clean=d.fails===0;
        return (
          <div key={build} className="card fu" style={{padding:"18px 22px",animationDelay:`${i*45}ms`,borderLeft:`3px solid ${clean?T.success:T.danger}`}}>
            <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{minWidth:110}}>
                <div style={{fontSize:12,color:T.t3,fontWeight:500,marginBottom:3}}>Build Number</div>
                <div style={{fontSize:24,fontWeight:700,color:T.gold,letterSpacing:"-0.03em",fontFamily:"'IBM Plex Mono',monospace"}}>#{build}</div>
              </div>
              <div style={{flex:1,minWidth:160}}>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:5}}>{[...d.projects].map(p=><span key={p} className="badge badge-info">{p}</span>)}</div>
                <div style={{fontSize:13,color:T.t3}}>{fmtTime(d.firstSeen)} → {fmtTime(d.lastSeen)}</div>
              </div>
              <div style={{display:"flex",gap:24}}>
                {[{l:"Runs",v:d.runs,c:T.accent},{l:"Failed",v:d.fails,c:clean?T.t3:T.danger}].map(x=>(
                  <div key={x.l} style={{textAlign:"center"}}>
                    <div style={{fontSize:26,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.03em"}}>{x.v}</div>
                    <div style={{fontSize:12,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
                  </div>
                ))}
              </div>
              <span className={`badge ${clean?"badge-ok":"badge-fail"}`} style={{fontSize:13}}>{clean?"Clean build":`${d.failedSteps.length} failure${d.failedSteps.length>1?"s":""}`}</span>
            </div>
            {d.failedSteps.length>0&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
                <div style={{fontSize:13,fontWeight:600,color:T.t1,marginBottom:8}}>Failed steps in this build</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {[...new Map(d.failedSteps.map(s=>[s.step+s.project,s])).values()].map((s,si)=>(
                    <div key={si} style={{fontSize:13,color:T.danger,background:T.dangerBg,border:`1px solid ${T.danger}35`,borderRadius:7,padding:"4px 12px"}}>
                      <span style={{color:T.t2,fontSize:12}}>{s.project} / </span>{s.step}
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
function Overview({ summary, results, T }) {
  const kpi=summary?.kpi||{};
  const spark7=useMemo(()=>{const m={}; results.forEach(r=>{const d=new Date(r.timestamp).toDateString(); m[d]=(m[d]||0)+(r.failed_steps||0);}); return Object.values(m).slice(-7);},[results]);
  const sparkR=useMemo(()=>{const m={}; results.forEach(r=>{const d=new Date(r.timestamp).toDateString(); m[d]=(m[d]||0)+1;}); return Object.values(m).slice(-7);},[results]);
  const fr=parseFloat(kpi.overall_failure_rate)||0;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:14}}>
        {[
          {label:"Total Script Runs",  value:kpi.total_runs||0,         color:T.accent,  spark:sparkR,sub:"All products combined"},
          {label:"Failed Runs",        value:kpi.failed_runs||0,        color:T.danger,  spark:spark7,sub:"Runs with failures"},
          {label:"Step Executions",    value:kpi.total_steps_run||0,    color:T.warn,    sub:"Total step checks"},
          {label:"Step Failures",      value:kpi.total_failures||0,     color:T.danger,  sub:"Individual step fails"},
          {label:"Failure Rate",       value:fr,dec:1,suffix:"%",       color:healthC(fr,T),sub:"Overall health"},
          {label:"Avg Script Duration",value:kpi.avg_duration||0,dec:1,suffix:"s",color:T.info,sub:"Seconds per run"},
        ].map((c,i)=><KpiCard key={c.label} {...c} delay={i*50} T={T}/>)}
      </div>
      <Section title="Product Health" sub="Live status per product" T={T}>
        <div style={{padding:"20px"}}><ProductGrid results={results} T={T}/></div>
      </Section>
      <Section title="Active Failures" sub="Steps currently failing — sorted by impact" T={T}>
        <FailTable summary={summary} T={T}/>
      </Section>
    </div>
  );
}

/* ─── PAGE META ───────────────────────────────────────────────── */
const PAGES={
  overview:{title:"Overview",        sub:"System-wide health metrics"},
  failures:{title:"Failure Tracker", sub:"All steps with recorded failures"},
  products:{title:"Products",        sub:"Per-product health breakdown"},
  runs:    {title:"Run History",     sub:"Full execution log — click any row to expand"},
  steps:   {title:"Step Analytics",  sub:"Failure rate and response time per step"},
  builds:  {title:"Build Tracker",   sub:"Trace failures to specific build numbers"},
};

/* ─── PAGE HEADER ─────────────────────────────────────────────── */
function PageHeader({ page, T }) {
  const meta = PAGES[page];
  const iconMap = {
    overview: <OverviewIcon/>, failures: <FailIcon/>, products: <ProductIcon/>,
    runs: <RunIcon/>, steps: <StepIcon/>, builds: <BuildIcon/>
  };
  return (
    <div className="fu" style={{marginBottom:24,display:"flex",alignItems:"center",gap:14}}>
      <div style={{
        width:44,height:44,borderRadius:12,flexShrink:0,
        background:T.accentBg,
        border:`1px solid ${T.accent}33`,
        display:"flex",alignItems:"center",justifyContent:"center",
        color:T.accent,
      }}>
        {iconMap[page]}
      </div>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:T.t0,letterSpacing:"-0.025em",lineHeight:1.2}}>{meta.title}</h1>
        <p style={{fontSize:13.5,color:T.t2,marginTop:3}}>{meta.sub}</p>
      </div>
    </div>
  );
}

/* ─── APP ─────────────────────────────────────────────────────── */
export default function App() {
  const [page,setPage]         = useState("overview");
  const [filters,setFilters]   = useState({});
  const [data,setData]         = useState({results:[],summary:null,projects:[],clusters:[]});
  const [loading,setLoading]   = useState(true);
  const [waking,setWaking]     = useState(false);
  const [error,setError]       = useState(null);
  const [lastUpdated,setLastUpdated] = useState(null);
  const [isDark,setDark]       = useState(()=>{
    try{ return localStorage.getItem("arc-theme")==="light"?false:true; }catch{ return true; }
  });

  const T = isDark ? DARK : LIGHT;

  useEffect(()=>{ try{ localStorage.setItem("arc-theme",isDark?"dark":"light"); }catch{} },[isDark]);

  const buildQS=useCallback((extra={})=>{
    const p=new URLSearchParams();
    Object.entries({...filters,...extra}).forEach(([k,v])=>{if(v)p.set(k,v);});
    return p.toString();
  },[filters]);

  const fetchData=useCallback(async(isWake=false)=>{
    try{
      setError(null); if(isWake)setWaking(true);
      const h={Authorization:`Bearer ${TOKEN}`};
      const [rR,sR,pR]=await Promise.all([
        apiFetch(`${API_BASE}/api/results?${buildQS({limit:200})}`,{headers:h}),
        apiFetch(`${API_BASE}/api/results/summary?${buildQS()}`,{headers:h}),
        apiFetch(`${API_BASE}/api/results/projects`,{headers:h}),
      ]);
      const [rD,sD,pD]=await Promise.all([rR.json(),sR.json(),pR.json()]);
      setData({results:rD.results||[],summary:sD,projects:pD.projects||[],clusters:pD.clusters||[]});
      setLastUpdated(new Date());
    }catch(e){ setError(e.message); }
    finally{ setLoading(false); setWaking(false); }
  },[buildQS]);

  useEffect(()=>{ fetchData(); const iv=setInterval(fetchData,POLL_MS); return()=>clearInterval(iv); },[fetchData]);

  const failCount=data.results.filter(r=>r.has_failure).length;

  return (
    <>
      <style>{makeCSS(T)}</style>
      <div style={{display:"flex",minHeight:"100vh",background:T.pageBg}}>
        <Sidebar active={page} set={setPage} failCount={failCount} T={T}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
          <Topbar
            lastUpdated={lastUpdated} loading={loading} onRefresh={()=>fetchData(true)}
            filters={filters} setFilters={setFilters}
            projects={data.projects} clusters={data.clusters}
            T={T} isDark={isDark} setDark={setDark}
          />
          <main className="main-content" style={{flex:1,padding:"28px 28px",overflow:"auto"}}>
            <PageHeader page={page} T={T}/>

            {waking&&<WakeBanner T={T}/>}

            {error&&!waking&&(
              <div className="card" style={{padding:"16px 20px",marginBottom:20,border:`1px solid ${T.danger}44`,background:T.dangerBg,display:"flex",alignItems:"flex-start",gap:12}}>
                <span style={{fontSize:20,flexShrink:0}}>⚠</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:600,color:T.danger}}>Cannot reach API</div>
                  <div style={{fontSize:14,color:T.t1,marginTop:2}}>{error}</div>
                  <div style={{fontSize:13,color:T.t2,marginTop:4}}>The server may be starting up. Retrying automatically in the background.</div>
                </div>
                <button className="btn" onClick={()=>fetchData(true)} style={{flexShrink:0}}>Retry</button>
              </div>
            )}

            {loading?(
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:14}}>
                  {Array.from({length:6}).map((_,i)=>(
                    <div key={i} className="card" style={{padding:"20px",height:116}}>
                      <div className="skel" style={{height:14,width:"45%",marginBottom:14}}/>
                      <div className="skel" style={{height:34,width:"60%",marginBottom:10}}/>
                      <div className="skel" style={{height:12,width:"75%"}}/>
                    </div>
                  ))}
                </div>
                <div className="card skel" style={{height:220}}/>
              </div>
            ):(
              <>
                {page==="overview"&&<Overview summary={data.summary} results={data.results} T={T}/>}
                {page==="failures"&&<Section title="All Failure Events" sub={`${data.summary?.by_step?.filter(s=>s.failures>0).length||0} steps with recorded failures`} T={T}><FailTable summary={data.summary} T={T}/></Section>}
                {page==="products"&&<div className="fu"><ProductGrid results={data.results} T={T}/></div>}
                {page==="runs"&&<Section title="Execution Log" sub={`${data.results.length} total runs`} T={T}><RunHistory results={data.results} T={T}/></Section>}
                {page==="steps"&&<Section title="Step-Level Analytics" sub="Sorted by failure count" T={T}><StepAnalytics summary={data.summary} T={T}/></Section>}
                {page==="builds"&&<div className="fu"><BuildTracker results={data.results} T={T}/></div>}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}