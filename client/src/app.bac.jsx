// import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "https://qa-monitor.onrender.com";
// const TOKEN    = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_TOKEN) || "qa_monitor_secret_2026_xK9mP2";
// const POLL_MS  = 30000;

// /* ─── RETRY FETCH ─────────────────────────────────────────────── */
// async function apiFetch(url, opts = {}, retries = 4) {
//   for (let i = 0; i <= retries; i++) {
//     try {
//       const r = await fetch(url, opts);
//       if (!r.ok) throw new Error(`HTTP ${r.status}`);
//       return r;
//     } catch (e) {
//       const connErr = ["Failed to fetch","ERR_CONNECTION","NetworkError","network","Load failed"]
//         .some(s => e.message.includes(s));
//       if (connErr && i < retries) {
//         await new Promise(r => setTimeout(r, Math.pow(2, i + 1) * 1000));
//         continue;
//       }
//       throw e;
//     }
//   }
// }

// /* ─── THEME TOKENS ────────────────────────────────────────────── */
// const DARK = {
//   mode:        "dark",
//   /* backgrounds */
//   pageBg:      "#0B0F17",
//   cardBg:      "#111827",
//   cardBg2:     "#1A2234",
//   inputBg:     "#1A2234",
//   sidebarBg:         "#070B12",
//   sidebarBorder:     "rgba(255,255,255,0.06)",
//   sidebarItem:       "rgba(255,255,255,0.06)",
//   sidebarActiveText: "#FFFFFF",
//   sidebarActiveBg:   "rgba(59,130,246,0.18)",
//   sidebarActiveIcon: "#93C5FD",
//   sidebarActiveBar:  "#3B82F6",
//   sidebarText:       "rgba(255,255,255,0.70)",
//   sidebarSub:        "rgba(255,255,255,0.38)",
//   sidebarFooter:     "rgba(255,255,255,0.28)",
//   sidebarLiveBg:     "rgba(52,211,153,0.12)",
//   sidebarLiveBorder: "rgba(52,211,153,0.22)",
//   sidebarLiveText:   "#6EE7B7",
//   sidebarLiveDot:    "#34D399",
//   /* borders */
//   border:      "rgba(255,255,255,0.08)",
//   borderMid:   "rgba(255,255,255,0.14)",
//   borderFocus: "#3B82F6",
//   /* text — every level passes WCAG AA on card backgrounds */
//   t0:          "#F1F5F9",   /* headings */
//   t1:          "#CBD5E1",   /* body */
//   t2:          "#94A3B8",   /* secondary — NOT #9CA3AF on dark bg */
//   t3:          "#64748B",   /* muted hints */
//   /* semantic */
//   accent:      "#3B82F6",
//   accentBg:    "rgba(59,130,246,0.14)",
//   accentHover: "#2563EB",
//   success:     "#34D399",
//   successBg:   "rgba(52,211,153,0.12)",
//   warn:        "#FBBF24",
//   warnBg:      "rgba(251,191,36,0.12)",
//   danger:      "#F87171",
//   dangerBg:    "rgba(248,113,113,0.12)",
//   info:        "#67E8F9",
//   infoBg:      "rgba(103,232,249,0.10)",
//   gold:        "#FCD34D",
//   goldBg:      "rgba(252,211,77,0.12)",
//   /* shadows */
//   shadow:      "0 1px 4px rgba(0,0,0,0.5)",
//   shadowMd:    "0 4px 16px rgba(0,0,0,0.6)",
//   shadowLg:    "0 8px 32px rgba(0,0,0,0.7)",
// };

// const LIGHT = {
//   mode:        "light",
//   /* backgrounds */
//   pageBg:      "#F1F5F9",
//   cardBg:      "#FFFFFF",
//   cardBg2:     "#F8FAFC",
//   inputBg:     "#F1F5F9",
//   sidebarBg:         "#FFFFFF",
//   sidebarBorder:     "#E2E8F0",
//   sidebarItem:       "rgba(37,99,235,0.07)",
//   sidebarActiveText: "#1E293B",
//   sidebarActiveBg:   "rgba(37,99,235,0.10)",
//   sidebarActiveIcon: "#2563EB",
//   sidebarActiveBar:  "#2563EB",
//   sidebarText:       "#374151",
//   sidebarSub:        "#9CA3AF",
//   sidebarFooter:     "#9CA3AF",
//   sidebarLiveBg:     "rgba(5,150,105,0.08)",
//   sidebarLiveBorder: "rgba(5,150,105,0.20)",
//   sidebarLiveText:   "#059669",
//   sidebarLiveDot:    "#10B981",
//   /* borders */
//   border:      "#E2E8F0",
//   borderMid:   "#CBD5E1",
//   borderFocus: "#2563EB",
//   /* text — all pass WCAG AA on white */
//   t0:          "#0F172A",   /* headings */
//   t1:          "#1E293B",   /* body */
//   t2:          "#475569",   /* secondary */
//   t3:          "#64748B",   /* muted — darker than before */
//   /* semantic */
//   accent:      "#2563EB",
//   accentBg:    "#EFF6FF",
//   accentHover: "#1D4ED8",
//   success:     "#059669",
//   successBg:   "#ECFDF5",
//   warn:        "#D97706",
//   warnBg:      "#FFFBEB",
//   danger:      "#DC2626",
//   dangerBg:    "#FEF2F2",
//   info:        "#0369A1",
//   infoBg:      "#E0F2FE",
//   gold:        "#92400E",
//   goldBg:      "#FEF3C7",
//   /* shadows */
//   shadow:      "0 1px 3px rgba(15,23,42,0.08)",
//   shadowMd:    "0 4px 12px rgba(15,23,42,0.10)",
//   shadowLg:    "0 8px 24px rgba(15,23,42,0.12)",
// };

// /* ─── CSS FACTORY ─────────────────────────────────────────────── */
// const makeCSS = (T) => `
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

// *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
// html{scroll-behavior:smooth}
// body{
//   background:${T.pageBg};color:${T.t1};
//   font-family:'Inter',system-ui,sans-serif;font-size:15px;
//   line-height:1.6;-webkit-font-smoothing:antialiased;
//   min-height:100vh;overflow-x:hidden;
//   transition:background .25s,color .25s;
// }
// ::-webkit-scrollbar{width:5px;height:5px}
// ::-webkit-scrollbar-track{background:${T.cardBg2}}
// ::-webkit-scrollbar-thumb{background:${T.borderMid};border-radius:99px}

// /* ── KEYFRAMES ── */
// @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
// @keyframes fadeIn{from{opacity:0}to{opacity:1}}
// @keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
// @keyframes spin{to{transform:rotate(360deg)}}
// @keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
// @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
// @keyframes logoSlide{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
// @keyframes logoBadge{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
// @keyframes liveRipple{0%{transform:scale(1);opacity:.9}100%{transform:scale(2.6);opacity:0}}
// @keyframes badgeFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}}
// @keyframes badgePulseRing{0%{box-shadow:0 4px 18px rgba(37,99,235,0.45),0 0 0 0 rgba(37,99,235,0.4)}70%{box-shadow:0 4px 18px rgba(37,99,235,0.45),0 0 0 8px rgba(37,99,235,0)}100%{box-shadow:0 4px 18px rgba(37,99,235,0.45),0 0 0 0 rgba(37,99,235,0)}}
// @keyframes shineSwipe{0%{left:-80%}100%{left:140%}}
// @keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
// @keyframes barIn{from{width:0}to{width:var(--w)}}
// @keyframes borderPop{0%,100%{border-color:${T.danger}35}50%{border-color:${T.danger}80}}

// .fu{animation:fadeUp .42s cubic-bezier(.22,1,.36,1) both}
// .fi{animation:fadeIn .3s ease both}
// .sr{animation:slideR .32s cubic-bezier(.22,1,.36,1) both}

// /* ── CARDS ── */
// .card{
//   background:${T.cardBg};border:1px solid ${T.border};
//   border-radius:14px;box-shadow:${T.shadow};
//   transition:border-color .18s,box-shadow .18s;overflow:hidden;
// }
// .card:hover{border-color:${T.borderMid};box-shadow:${T.shadowMd}}

// /* ── BUTTONS ── */
// .btn{
//   display:inline-flex;align-items:center;gap:7px;
//   padding:9px 18px;border-radius:8px;border:1px solid ${T.border};
//   background:${T.cardBg};color:${T.t1};
//   font-family:'Inter',sans-serif;font-size:14px;font-weight:500;
//   cursor:pointer;transition:all .15s;white-space:nowrap;
// }
// .btn:hover{background:${T.cardBg2};border-color:${T.borderMid};color:${T.t0};box-shadow:${T.shadow}}
// .btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none}
// .btn.primary{background:${T.accent};border-color:${T.accent};color:#fff;font-weight:600}
// .btn.primary:hover{background:${T.accentHover};border-color:${T.accentHover};box-shadow:0 4px 14px ${T.accent}44}
// .btn.ghost{background:transparent;border-color:transparent;color:${T.t2}}
// .btn.ghost:hover{background:${T.cardBg2};border-color:${T.border};color:${T.t0}}

// /* ── BADGES ── */
// .badge{
//   display:inline-flex;align-items:center;padding:3px 10px;
//   font-size:12px;font-weight:600;border-radius:6px;letter-spacing:.01em;
//   font-family:'Inter',sans-serif;line-height:1.4;
// }
// .badge-ok   {background:${T.successBg};color:${T.success}}
// .badge-fail {background:${T.dangerBg};color:${T.danger}}
// .badge-warn {background:${T.warnBg};color:${T.warn}}
// .badge-info {background:${T.infoBg};color:${T.info}}
// .badge-gold {background:${T.goldBg};color:${T.gold}}
// .badge-muted{background:${T.cardBg2};color:${T.t2};border:1px solid ${T.border}}

// /* ── INPUTS ── */
// input,select{
//   background:${T.inputBg};border:1px solid ${T.border};border-radius:8px;
//   color:${T.t0};font-family:'Inter',sans-serif;font-size:14px;
//   padding:8px 12px;outline:none;
//   transition:border-color .18s,box-shadow .18s,transform .15s,background .15s;
//   min-width:0;
// }
// input:hover,select:hover{
//   border-color:${T.borderMid};
//   transform:translateY(-1px);
//   box-shadow:0 3px 8px ${T.shadow.includes("0.5")?"rgba(0,0,0,0.35)":"rgba(15,23,42,0.07)"};
// }
// input:focus,select:focus{
//   border-color:${T.borderFocus};
//   box-shadow:0 0 0 3px ${T.accent}28, 0 3px 10px ${T.accent}18;
//   transform:translateY(-1px);
//   background:${T.cardBg};
// }
// select option{background:${T.cardBg};color:${T.t0}}

// /* ── TABLE ── */
// table{border-collapse:collapse;width:100%}
// th{
//   color:${T.t2};font-size:12px;font-weight:600;letter-spacing:.04em;
//   padding:11px 16px;border-bottom:1px solid ${T.border};
//   text-align:left;white-space:nowrap;background:${T.cardBg2};
// }
// td{
//   padding:13px 16px;border-bottom:1px solid ${T.border};
//   font-size:14px;color:${T.t1};vertical-align:middle;
// }
// tr:last-child td{border-bottom:none}
// tbody tr{transition:background .1s}
// tbody tr:hover td{background:${T.cardBg2};color:${T.t0}}

// /* ── SKELETON ── */
// .skel{
//   background:linear-gradient(90deg,${T.cardBg2} 25%,${T.border} 50%,${T.cardBg2} 75%);
//   background-size:600px 100%;animation:shimmer 1.5s ease infinite;border-radius:6px;
// }

// /* ── RESPONSIVE ── */
// @media(max-width:900px){
//   .sidebar-full{display:none!important}
//   .sidebar-rail{display:flex!important}
//   .main-content{padding:16px!important}
//   .kpi-grid{grid-template-columns:repeat(2,1fr)!important}
//   .product-grid{grid-template-columns:1fr!important}
//   .topbar-filters{flex-wrap:wrap!important;gap:6px!important}
//   .hide-mobile{display:none!important}
// }
// @media(max-width:560px){
//   .kpi-grid{grid-template-columns:1fr!important}
//   .topbar-filters select,.topbar-filters input{min-width:120px!important;font-size:13px!important}
// }
// `;

// /* ─── UTILS ───────────────────────────────────────────────────── */
// const fmtTime = d => new Date(d).toLocaleString("en-IN",{month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit"});
// const fmtDur  = s => s >= 60 ? `${(s/60).toFixed(1)} min` : `${(s||0).toFixed(1)}s`;
// const fmtPct  = n => `${parseFloat(n||0).toFixed(1)}%`;
// const healthC = (r, T) => { const v=parseFloat(r); if(v===0)return T.success; if(v<10)return T.info; if(v<30)return T.warn; return T.danger; };
// const statusC = (code, T) => { const c=parseInt(code); if(c>=200&&c<300)return T.success; if(c>=400&&c<500)return T.warn; return T.danger; };

// /* ─── ANIMATED COUNTER ────────────────────────────────────────── */
// function Counter({ to, dec=0, suffix="" }) {
//   const [v,setV] = useState(0);
//   const raf=useRef(); const prev=useRef(0);
//   useEffect(()=>{
//     const target=parseFloat(to)||0, from=prev.current;
//     prev.current=target;
//     const t0=Date.now(), dur=750;
//     const tick=()=>{ const p=Math.min((Date.now()-t0)/dur,1), e=1-Math.pow(1-p,3); setV(from+(target-from)*e); if(p<1) raf.current=requestAnimationFrame(tick); };
//     raf.current=requestAnimationFrame(tick);
//     return ()=>cancelAnimationFrame(raf.current);
//   },[to]);
//   return <>{dec ? v.toFixed(dec) : Math.round(v).toLocaleString()}{suffix}</>;
// }

// /* ─── SPARKLINE ───────────────────────────────────────────────── */
// function Spark({ data=[], color, w=72, h=32 }) {
//   if(!data||data.length<2) return <div style={{width:w,height:h}}/>;
//   const max=Math.max(...data,1);
//   const pts=data.map((v,i)=>({x:(i/(data.length-1))*w, y:h-4-(v/max)*(h-8)}));
//   const line=pts.map(p=>`${p.x},${p.y}`).join(" ");
//   const id=`sg${color.replace(/[^a-z0-9]/gi,"")}`;
//   return (
//     <svg width={w} height={h} style={{display:"block",overflow:"visible",flexShrink:0}}>
//       <defs>
//         <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={color} stopOpacity=".28"/>
//           <stop offset="100%" stopColor={color} stopOpacity="0"/>
//         </linearGradient>
//       </defs>
//       <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`}/>
//       <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
//       <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.8" fill={color}/>
//     </svg>
//   );
// }

// /* ─── GAUGE ───────────────────────────────────────────────────── */
// function Gauge({ failRate=0, T, size=70 }) {
//   const r=26, circ=2*Math.PI*r, health=100-Math.min(parseFloat(failRate)||0,100), col=healthC(failRate,T);
//   return (
//     <svg width={size} height={size} viewBox="0 0 72 72" style={{flexShrink:0}}>
//       <circle cx="36" cy="36" r={r} fill="none" stroke={T.border} strokeWidth="6"/>
//       <circle cx="36" cy="36" r={r} fill="none" stroke={col} strokeWidth="6"
//         strokeDasharray={`${circ*(health/100)} ${circ*(1-health/100)}`} strokeLinecap="round"
//         transform="rotate(-90 36 36)" style={{transition:"stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)"}}/>
//       <text x="36" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={col} fontFamily="Inter,sans-serif">{Math.round(health)}%</text>
//       <text x="36" y="47" textAnchor="middle" fontSize="9" fill={T.t3} fontFamily="Inter,sans-serif">HEALTH</text>
//     </svg>
//   );
// }

// /* ─── WAKE BANNER ─────────────────────────────────────────────── */
// function WakeBanner({ T }) {
//   const [p,setP]=useState(0);
//   useEffect(()=>{ const iv=setInterval(()=>setP(x=>Math.min(x+2,92)),700); return()=>clearInterval(iv); },[]);
//   return (
//     <div className="card" style={{padding:"16px 20px",marginBottom:20,border:`1px solid ${T.accent}44`,background:T.infoBg}}>
//       <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
//         <div style={{width:8,height:8,borderRadius:"50%",background:T.info,animation:"pulse 1.2s ease infinite"}}/>
//         <span style={{fontSize:15,fontWeight:600,color:T.info}}>Server is waking up — retrying automatically</span>
//       </div>
//       <div style={{background:T.border,borderRadius:99,height:4,overflow:"hidden",marginBottom:8}}>
//         <div style={{width:`${p}%`,height:"100%",background:T.accent,borderRadius:99,transition:"width .7s ease"}}/>
//       </div>
//       <p style={{fontSize:13,color:T.t2,lineHeight:1.5}}>
//         Render free tier spins down after 15 min of inactivity. Cold start takes ~30 seconds. Hang tight.
//       </p>
//     </div>
//   );
// }

// /* ─── LOGO ────────────────────────────────────────────────────── */
// function SidebarLogo({ T }) {
//   const [pressed,  setPressed]  = useState(false);
//   const [hovered,  setHovered]  = useState(false);
//   const shineRef = useRef();

//   /* click: spring pop + trigger shine swipe */
//   const handleClick = () => {
//     setPressed(true);
//     /* re-trigger shine animation by removing + re-adding the class trick via style swap */
//     if (shineRef.current) {
//       shineRef.current.style.animation = "none";
//       shineRef.current.getBoundingClientRect(); // force reflow
//       shineRef.current.style.animation = "shineSwipe .55s ease forwards";
//     }
//     setTimeout(() => setPressed(false), 380);
//   };

//   const isDark = T.mode === "dark";

//   /* badge dynamic style */
//   const badgeStyle = {
//     width:48, height:48, borderRadius:13, flexShrink:0,
//     background:"linear-gradient(135deg,#2563EB 0%,#1D4ED8 55%,#1E40AF 100%)",
//     display:"flex", alignItems:"center", justifyContent:"center",
//     position:"relative", overflow:"hidden",
//     cursor:"pointer",
//     /* entry animation — plays once on mount */
//     animation: pressed
//       ? "none"
//       : hovered
//         ? "badgePulseRing 1.4s ease infinite"
//         : "logoBadge .55s cubic-bezier(.34,1.56,.64,1) .1s both, badgePulseRing 3s ease 2s infinite",
//     transform: pressed ? "scale(0.90)" : hovered ? "scale(1.06)" : "scale(1)",
//     boxShadow: pressed
//       ? "0 2px 6px rgba(37,99,235,0.3), 0 0 0 3px rgba(37,99,235,0.22)"
//       : hovered
//         ? "0 6px 22px rgba(37,99,235,0.6), 0 0 0 1px rgba(255,255,255,0.15) inset"
//         : "0 4px 16px rgba(37,99,235,0.42), 0 0 0 1px rgba(255,255,255,0.10) inset",
//     transition:"transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .2s ease",
//   };

//   return (
//     <div style={{padding:"22px 20px 20px", borderBottom:`1px solid ${T.sidebarBorder}`}}>

//       {/* ── Badge + wordmark row ── */}
//       <div
//         onClick={handleClick}
//         onMouseEnter={()=>setHovered(true)}
//         onMouseLeave={()=>setHovered(false)}
//         style={{
//           display:"flex", alignItems:"center", gap:13, marginBottom:14,
//           cursor:"pointer",
//           /* slide-in on first load */
//           animation:"logoSlide .6s cubic-bezier(.22,1,.36,1) both",
//         }}>

//         {/* ARC badge */}
//         <div style={badgeStyle}>
//           {/* shine strip — triggered by handleClick via ref */}
//           <div ref={shineRef} style={{
//             position:"absolute", top:0, left:"-80%",
//             width:"50%", height:"100%",
//             background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.30),transparent)",
//             transform:"skewX(-18deg)",
//             pointerEvents:"none",
//           }}/>
//           <span style={{
//             fontFamily:"'Inter',sans-serif", fontWeight:800, fontSize:16,
//             color:"#fff", letterSpacing:"-0.03em", position:"relative",
//             /* subtle idle float on the text only */
//             animation:"badgeFloat 4s ease-in-out 1.5s infinite",
//             display:"inline-block",
//           }}>ARC</span>
//         </div>

//         {/* Wordmark — staggered slide in */}
//         <div style={{
//           animation:"logoSlide .52s cubic-bezier(.22,1,.36,1) .18s both",
//           opacity:0, animationFillMode:"forwards",
//         }}>
//           <div style={{
//             fontFamily:"'Inter',sans-serif", fontWeight:700, fontSize:16,
//             color: isDark ? "#FFFFFF" : "#0F172A",
//             letterSpacing:"-0.01em", lineHeight:1.25,
//           }}>Document</div>
//           <div style={{
//             fontFamily:"'Inter',sans-serif", fontWeight:400, fontSize:15,
//             color: isDark ? "rgba(255,255,255,0.58)" : "#4B5563",
//             letterSpacing:"-0.01em", lineHeight:1.25,
//           }}>Solutions</div>
//         </div>
//       </div>

//       {/* Divider */}
//       <div style={{height:1, background:T.sidebarBorder, marginBottom:12}}/>

//       {/* Live indicator */}
//       <div style={{
//         display:"flex", alignItems:"center", gap:9, padding:"7px 12px",
//         background:T.sidebarLiveBg, borderRadius:8,
//         border:`1px solid ${T.sidebarLiveBorder}`,
//       }}>
//         <div style={{position:"relative", flexShrink:0}}>
//           <div style={{width:8,height:8,borderRadius:"50%",background:T.sidebarLiveDot}}/>
//           <div style={{
//             position:"absolute", inset:-3, borderRadius:"50%",
//             border:`1.5px solid ${T.sidebarLiveDot}`,
//             animation:"liveRipple 2s ease-out infinite",
//           }}/>
//         </div>
//         <span style={{fontSize:13, color:T.sidebarLiveText, fontWeight:500, letterSpacing:".01em"}}>
//           QA Monitor · Live
//         </span>
//       </div>
//     </div>
//   );
// }

// /* ─── SIDEBAR ─────────────────────────────────────────────────── */
// const NAV=[
//   {id:"overview",label:"Overview",       sub:"System health",    icon:"⊞"},
//   {id:"failures",label:"Failure Tracker",sub:"Failed steps",     icon:"⚠"},
//   {id:"products",label:"Products",       sub:"Per-product view", icon:"◈"},
//   {id:"runs",    label:"Run History",    sub:"Execution log",    icon:"⊙"},
//   {id:"steps",   label:"Step Analytics", sub:"Step breakdown",   icon:"≡"},
//   {id:"builds",  label:"Build Tracker",  sub:"Build diagnostics",icon:"⌗"},
//   {id:"arcai",   label:"ARC AI",         sub:"AI script monitor", icon:"⬡", ai:true},
// ];

// function Sidebar({ active, set, failCount, T, mobileOpen, setMobileOpen }) {
//   const navBody = (
//     <nav style={{flex:1,padding:"10px 10px",display:"flex",flexDirection:"column",gap:2,overflow:"auto"}}>
//       {NAV.map(({id,label,sub,icon})=>{
//         const on=active===id;
//         return (
//           <button key={id} onClick={()=>{set(id);setMobileOpen&&setMobileOpen(false);}} style={{
//             display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
//             borderRadius:9,border:"none",cursor:"pointer",textAlign:"left",width:"100%",
//             background:on ? T.sidebarActiveBg : "transparent",
//             transition:"background .15s,transform .1s",
//             transform:"scale(1)",
//           }}
//           onMouseDown={e=>e.currentTarget.style.transform="scale(0.97)"}
//           onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
//           onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
//           >
//             <span style={{
//               fontSize:17,width:22,textAlign:"center",flexShrink:0,
//               color: on ? T.sidebarActiveIcon : T.sidebarSub,
//               transition:"color .15s",
//             }}>{icon}</span>
//             <div style={{flex:1,minWidth:0}}>
//               <div style={{
//                 fontSize:15,fontWeight:on ? 600 : 500,
//                 color: on ? T.sidebarActiveText : T.sidebarText,
//                 display:"flex",alignItems:"center",gap:8,
//                 transition:"color .15s",letterSpacing:"-0.01em",
//               }}>
//                 {label}
//                 {id==="failures"&&failCount>0&&(
//                   <span style={{background:"#EF4444",color:"#fff",borderRadius:99,fontSize:11,fontWeight:700,padding:"1px 7px",lineHeight:1.4,animation:"pulse 2s ease infinite"}}>{failCount}</span>
//                 )}
//                 {NAV.find(n=>n.id===id)?.ai&&(
//                   <span style={{background:"linear-gradient(90deg,#6366F1,#8B5CF6)",color:"#fff",borderRadius:4,fontSize:9,fontWeight:700,padding:"1px 5px",letterSpacing:"0.04em"}}>AI</span>
//                 )}
//               </div>
//               <div style={{fontSize:12,color:T.sidebarSub,marginTop:2,fontWeight:400}}>{sub}</div>
//             </div>
//             {on&&<div style={{width:3,height:20,background:T.sidebarActiveBar,borderRadius:99,flexShrink:0,boxShadow:`0 0 8px ${T.sidebarActiveBar}88`}}/>}
//           </button>
//         );
//       })}
//     </nav>
//   );

//   const footer=(
//     <div style={{padding:"14px 20px",borderTop:`1px solid ${T.sidebarBorder}`}}>
//       <div style={{fontSize:12,color:T.sidebarFooter,lineHeight:2}}>
//         <div>Poll interval: 30 s</div>
//         <div>v2.2 · Internal Tool</div>
//       </div>
//     </div>
//   );

//   return (
//     <>
//       {/* Full sidebar — hidden on mobile */}
//       <aside className="sidebar-full" style={{
//         width:232,flexShrink:0,background:T.sidebarBg,
//         borderRight:`1px solid ${T.sidebarBorder}`,
//         display:"flex",flexDirection:"column",
//         height:"100vh",position:"sticky",top:0,zIndex:30,
//       }}>
//         <SidebarLogo T={T}/>
//         {navBody}
//         {footer}
//       </aside>

//       {/* Rail sidebar — shown on mobile */}
//       <aside className="sidebar-rail" style={{
//         width:56,flexShrink:0,background:T.sidebarBg,
//         borderRight:`1px solid ${T.sidebarBorder}`,
//         display:"none",flexDirection:"column",alignItems:"center",
//         height:"100vh",position:"sticky",top:0,zIndex:30,paddingTop:14,gap:2,
//       }}>
//         <div style={{
//           width:36,height:36,borderRadius:8,
//           background:"linear-gradient(135deg,#2563EB,#1E40AF)",
//           display:"flex",alignItems:"center",justifyContent:"center",
//           marginBottom:12,boxShadow:"0 3px 12px rgba(37,99,235,0.5)",
//         }}>
//           <span style={{fontFamily:"Inter",fontWeight:800,fontSize:12,color:"#fff"}}>ARC</span>
//         </div>
//         {NAV.map(({id,label,icon})=>{
//           const on=active===id;
//           return (
//             <button key={id} title={label} onClick={()=>set(id)} style={{
//               width:40,height:40,borderRadius:8,border:"none",cursor:"pointer",
//               background:on?"rgba(59,130,246,0.2)":"transparent",
//               color:on?T.sidebarActiveIcon:T.sidebarSub,
//               fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",
//               transition:"all .15s",position:"relative",
//             }}>
//               {icon}
//               {id==="failures"&&failCount>0&&(
//                 <span style={{position:"absolute",top:4,right:4,width:8,height:8,background:"#EF4444",borderRadius:"50%"}}/>
//               )}
//             </button>
//           );
//         })}
//       </aside>
//     </>
//   );
// }

// /* ─── TOPBAR ──────────────────────────────────────────────────── */
// /* ─── TIME PRESET HELPERS ────────────────────────────────────── */
// const TIME_PRESETS = [
//   { id:"24h",  label:"24 hrs" },
//   { id:"48h",  label:"48 hrs" },
//   { id:"3d",   label:"3 days" },
//   { id:"7d",   label:"7 days" },
//   { id:"1m",   label:"1 month" },
//   { id:"custom",label:"Custom" },
// ];

// function presetToFromTo(id) {
//   const now  = new Date();
//   const toStr = now.toISOString().slice(0,10);
//   const map = { "24h":1, "48h":2, "3d":3, "7d":7, "1m":30 };
//   if (!map[id]) return { from:"", to:"" };
//   const from = new Date(now);
//   from.setDate(from.getDate() - map[id]);
//   return { from: from.toISOString().slice(0,10), to: toStr };
// }

// function Topbar({ lastUpdated, loading, onRefresh, filters, setFilters, projects, clusters, T, isDark, setDark }) {
//   const activePreset = filters._preset || null;
//   const showCustom   = activePreset === "custom" || (!activePreset && (filters.from || filters.to));
//   const hasFilter    = Object.entries(filters).some(([k,v]) => v && k !== "_preset");

//   const applyPreset = (id) => {
//     if (id === "custom") {
//       setFilters(f => ({ ...f, _preset:"custom", from:"", to:"" }));
//       return;
//     }
//     const { from, to } = presetToFromTo(id);
//     setFilters(f => ({ ...f, _preset:id, from, to }));
//   };

//   /* pill group background — a recessed "tray" feel */
//   const pillTray = {
//     display:"flex", alignItems:"center", gap:2,
//     background: T.mode === "dark" ? "rgba(255,255,255,0.05)" : T.cardBg2,
//     border: `1px solid ${T.border}`,
//     borderRadius: 10, padding:"3px",
//   };

//   const pill = (id, label) => {
//     const on = id === "custom" ? showCustom : activePreset === id;
//     return (
//       <button key={id} onClick={()=>applyPreset(id)} style={{
//         padding:"5px 13px", borderRadius:7,
//         border: "none",
//         background: on ? T.cardBg : "transparent",
//         color: on ? T.accent : T.t2,
//         fontSize:13, fontWeight: on ? 600 : 400,
//         cursor:"pointer", transition:"all .15s",
//         fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap",
//         boxShadow: on ? T.shadow : "none",
//         lineHeight:1.4,
//       }}>
//         {label}
//       </button>
//     );
//   };

//   return (
//     <header style={{
//       borderBottom:`1px solid ${T.border}`,
//       background:`${T.cardBg}F8`, backdropFilter:"blur(14px)",
//       position:"sticky", top:0, zIndex:10, flexShrink:0,
//     }}>

//       {/* ── Single unified filter row ─────────────────────────────── */}
//       <div style={{
//         display:"flex", alignItems:"center",
//         padding:"10px 20px", gap:10, flexWrap:"wrap",
//       }}>

//         {/* LEFT: dropdowns group */}
//         <div style={{
//           display:"flex", alignItems:"center", gap:6,
//           flexWrap:"wrap", flex:1, minWidth:0,
//         }}>
//           {[
//             ["project",     "Product",    projects.map(p=>({v:p,l:p}))],
//             ["cluster",     "Cluster",    clusters.map(c=>({v:c,l:c}))],
//             ["script_type", "Script",     [{v:"5min",l:"5 min"},{v:"30min",l:"30 min"}]],
//             ["status",      "Status",     [{v:"failed",l:"Failed"},{v:"passed",l:"Passed"}]],
//           ].map(([key,ph,opts])=>(
//             <select key={key} value={filters[key]||""}
//               onChange={e=>setFilters(f=>({...f,[key]:e.target.value}))}
//               style={{
//                 fontSize:13, padding:"6px 10px",
//                 minWidth:0, width:"auto", flex:"0 0 auto",
//                 maxWidth:150,
//               }}>
//               <option value="">{ph}</option>
//               {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
//             </select>
//           ))}
//         </div>

//         {/* DIVIDER */}
//         <div style={{width:1, height:28, background:T.border, flexShrink:0}} className="hide-mobile"/>

//         {/* CENTER: time range pill tray */}
//         <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap"}}>
//           <span style={{fontSize:12, color:T.t3, fontWeight:500, whiteSpace:"nowrap", letterSpacing:"0.01em"}}>
//             Range
//           </span>
//           <div style={pillTray}>
//             {TIME_PRESETS.filter(p => p.id !== "custom").map(p => pill(p.id, p.label))}
//           </div>
//           {/* Custom as separate outlined button */}
//           <button onClick={()=>applyPreset("custom")} style={{
//             padding:"5px 13px", borderRadius:7,
//             border:`1px solid ${showCustom ? T.accent : T.border}`,
//             background: showCustom ? T.accentBg : "transparent",
//             color: showCustom ? T.accent : T.t2,
//             fontSize:13, fontWeight: showCustom ? 600 : 400,
//             cursor:"pointer", transition:"all .15s",
//             fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap",
//           }}>
//             ⊕ Custom
//           </button>

//           {/* Custom date pickers — inline, compact */}
//           {showCustom && (
//             <div style={{
//               display:"flex", alignItems:"center", gap:6,
//               animation:"fadeIn .18s ease both",
//               background: T.mode === "dark" ? "rgba(255,255,255,0.04)" : T.cardBg2,
//               border:`1px solid ${T.border}`,
//               borderRadius:8, padding:"4px 10px",
//             }}>
//               <input type="date"
//                 value={filters.from||""}
//                 onChange={e=>setFilters(f=>({...f,from:e.target.value,_preset:"custom"}))}
//                 style={{width:130, fontSize:13, padding:"4px 8px", border:"none", background:"transparent", outline:"none", color:T.t0}}
//               />
//               <span style={{color:T.t3, fontSize:12, flexShrink:0}}>→</span>
//               <input type="date"
//                 value={filters.to||""}
//                 onChange={e=>setFilters(f=>({...f,to:e.target.value,_preset:"custom"}))}
//                 style={{width:130, fontSize:13, padding:"4px 8px", border:"none", background:"transparent", outline:"none", color:T.t0}}
//               />
//             </div>
//           )}
//         </div>

//         {/* DIVIDER */}
//         <div style={{width:1, height:28, background:T.border, flexShrink:0}} className="hide-mobile"/>

//         {/* RIGHT: actions */}
//         <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0}}>
//           {hasFilter && (
//             <button className="btn ghost" onClick={()=>setFilters({})}
//               style={{fontSize:13, padding:"6px 12px", color:T.danger, borderColor:`${T.danger}40`}}>
//               Clear ×
//             </button>
//           )}
//           {lastUpdated && (
//             <span className="hide-mobile" style={{fontSize:12, color:T.t3, whiteSpace:"nowrap"}}>
//               {fmtTime(lastUpdated)}
//             </span>
//           )}
//           <button className="btn ghost" onClick={()=>setDark(d=>!d)}
//             title="Toggle theme" style={{padding:"7px 9px", fontSize:16, flexShrink:0}}>
//             {isDark ? "☀" : "◑"}
//           </button>
//           <button className="btn primary" onClick={onRefresh} style={{flexShrink:0}}>
//             <span style={loading?{display:"inline-block",animation:"spin .7s linear infinite"}:{}}
//               aria-hidden="true">↻</span>
//             Refresh
//           </button>
//         </div>

//       </div>
//     </header>
//   );
// }

// /* ─── SECTION ─────────────────────────────────────────────────── */
// function Section({ title, sub, children, T, action }) {
//   return (
//     <div className="card">
//       <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:`1px solid ${T.border}`,background:T.cardBg2,gap:12,flexWrap:"wrap"}}>
//         <div>
//           <div style={{fontSize:16,fontWeight:700,color:T.t0}}>{title}</div>
//           {sub&&<div style={{fontSize:13,color:T.t3,marginTop:2}}>{sub}</div>}
//         </div>
//         {action}
//       </div>
//       {children}
//     </div>
//   );
// }

// /* ─── KPI CARD ────────────────────────────────────────────────── */
// function KpiCard({ label, value, sub, color, spark, delay=0, dec=0, suffix="", T }) {
//   return (
//     <div className="card fu" style={{padding:"20px 22px",animationDelay:`${delay}ms`,borderTop:`2.5px solid ${color}`}}>
//       <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
//         <div style={{width:38,height:38,borderRadius:9,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
//           <div style={{width:12,height:12,borderRadius:"50%",background:color}}/>
//         </div>
//         {spark&&<Spark data={spark} color={color}/>}
//       </div>
//       <div style={{fontSize:32,fontWeight:700,color:T.t0,lineHeight:1,letterSpacing:"-0.03em",animation:"countUp .5s ease both",animationDelay:`${delay+120}ms`,fontVariantNumeric:"tabular-nums"}}>
//         <span style={{color}}><Counter to={value} dec={dec} suffix={suffix}/></span>
//       </div>
//       <div style={{fontSize:14,fontWeight:600,color:T.t1,marginTop:7}}>{label}</div>
//       {sub&&<div style={{fontSize:13,color:T.t2,marginTop:2}}>{sub}</div>}
//     </div>
//   );
// }

// /* ─── PRODUCT GRID ────────────────────────────────────────────── */
// function ProductGrid({ results, T }) {
//   const m={};
//   results.forEach(r=>{
//     const k=r.project;
//     if(!m[k]) m[k]={runs:0,failRuns:0,steps:0,failSteps:0,lastRun:null,types:new Set()};
//     const p=m[k]; p.runs++; if(r.has_failure)p.failRuns++;
//     p.steps+=r.total_steps||0; p.failSteps+=r.failed_steps||0;
//     p.types.add(r.script_type);
//     if(!p.lastRun||new Date(r.timestamp)>new Date(p.lastRun)){p.lastRun=r.timestamp;p.lastBuild=r.build_number;p.cluster=r.cluster;}
//   });
//   return (
//     <div className="product-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
//       {Object.entries(m).map(([name,d],i)=>{
//         const rate=d.steps>0?(d.failSteps/d.steps)*100:0, col=healthC(rate,T);
//         return (
//           <div key={name} className="card fu" style={{padding:"20px",animationDelay:`${i*55}ms`,borderLeft:`3px solid ${col}`}}>
//             <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
//               <div style={{flex:1,paddingRight:12}}>
//                 <div style={{fontSize:15,fontWeight:700,color:T.t0,marginBottom:7,lineHeight:1.3}}>{name}</div>
//                 <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
//                   {d.cluster&&<span className="badge badge-muted">{d.cluster}</span>}
//                   {[...d.types].map(tp=><span key={tp} className="badge badge-info">{tp}</span>)}
//                 </div>
//               </div>
//               <Gauge failRate={rate} T={T} size={68}/>
//             </div>
//             <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
//               {[
//                 {l:"Runs",      v:d.runs,      c:T.accent},
//                 {l:"Failed",    v:d.failRuns,  c:d.failRuns>0?T.danger:T.t3},
//                 {l:"Step fails",v:d.failSteps, c:d.failSteps>0?T.warn:T.t3},
//               ].map(x=>(
//                 <div key={x.l} style={{background:T.cardBg2,borderRadius:8,padding:"10px"}}>
//                   <div style={{fontSize:22,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.02em"}}>{x.v}</div>
//                   <div style={{fontSize:11,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
//                 </div>
//               ))}
//             </div>
//             <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:`1px solid ${T.border}`}}>
//               <span style={{fontSize:13,color:T.t3}}>{d.lastRun?fmtTime(d.lastRun):"—"}</span>
//               {d.lastBuild&&<span className="badge badge-gold">Build #{d.lastBuild}</span>}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ─── FAIL TABLE ──────────────────────────────────────────────── */
// function FailTable({ summary, T }) {
//   const [sort,setSort]=useState({k:"failures",d:"desc"});
//   const rows=[...(summary?.by_step||[])].filter(s=>s.failures>0).sort((a,b)=>{const av=a[sort.k],bv=b[sort.k];return sort.d==="desc"?bv-av:av-bv;});
//   const tog=k=>setSort(s=>({k,d:s.k===k&&s.d==="desc"?"asc":"desc"}));
//   if(!rows.length) return (
//     <div style={{textAlign:"center",padding:"52px 20px",color:T.t3}}>
//       <div style={{fontSize:34,marginBottom:8}}>✓</div>
//       <div style={{fontSize:16,fontWeight:600,color:T.success}}>All systems nominal</div>
//       <div style={{fontSize:14,color:T.t2,marginTop:4}}>No failures in the selected time range</div>
//     </div>
//   );
//   const cols=[{k:"_id",l:"Step Name"},{k:"failures",l:"Failures"},{k:"total",l:"Runs"},{k:"failure_rate",l:"Failure Rate"},{k:"avg_response_time",l:"Avg Response"},{k:"last_run",l:"Last Seen"}];
//   return (
//     <div style={{overflowX:"auto"}}>
//       <table>
//         <thead><tr>{cols.map(c=><th key={c.k} onClick={()=>tog(c.k)} style={{cursor:"pointer",userSelect:"none"}}>{c.l}{sort.k===c.k?(sort.d==="desc"?" ↓":" ↑"):""}</th>)}<th>Status</th></tr></thead>
//         <tbody>
//           {rows.map((s,i)=>{
//             const rate=parseFloat(s.failure_rate)||0, col=healthC(rate,T);
//             return (
//               <tr key={s._id} className="sr" style={{animationDelay:`${i*18}ms`}}>
//                 <td style={{maxWidth:280,minWidth:160}}><span style={{fontWeight:600,color:T.t0,fontSize:14}}>{s._id}</span></td>
//                 <td><span style={{fontSize:21,fontWeight:700,color:T.danger,letterSpacing:"-0.02em"}}>{s.failures}</span></td>
//                 <td style={{color:T.t2,fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>{s.total}</td>
//                 <td>
//                   <div style={{display:"flex",alignItems:"center",gap:10}}>
//                     <div style={{width:88,height:5,background:T.cardBg2,borderRadius:99,overflow:"hidden",flexShrink:0}}>
//                       <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1s ease"}}/>
//                     </div>
//                     <span style={{fontSize:13,color:col,fontWeight:700,minWidth:42,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtPct(rate)}</span>
//                   </div>
//                 </td>
//                 <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t1}}>{s.avg_response_time?.toFixed(2)}s</td>
//                 <td style={{fontSize:13,color:T.t2,whiteSpace:"nowrap"}}>{s.last_run?fmtTime(s.last_run):"—"}</td>
//                 <td><span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`}>{rate===0?"Nominal":rate<20?"Degraded":"Critical"}</span></td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// /* ─── RUN HISTORY ─────────────────────────────────────────────── */
// function RunHistory({ results, T }) {
//   const [exp,setExp]=useState(null);
//   const [page,setPage]=useState(1);
//   const PER=15, pages=Math.ceil(results.length/PER);
//   const visible=results.slice((page-1)*PER,page*PER);
//   return (
//     <div>
//       <div style={{overflowX:"auto"}}>
//         <table>
//           <thead><tr><th style={{width:24}}/><th>Timestamp</th><th>Product</th><th className="hide-mobile">Cluster</th><th>Script</th><th>Build</th><th>Steps</th><th className="hide-mobile">Duration</th><th>Result</th></tr></thead>
//           <tbody>
//             {visible.map(r=>{
//               const open=exp===r._id;
//               return [
//                 <tr key={r._id} onClick={()=>setExp(open?null:r._id)} style={{cursor:"pointer",background:open?T.accentBg:undefined}}>
//                   <td style={{textAlign:"center",color:T.t3,fontSize:12}}>
//                     <span style={{display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .2s"}}>▶</span>
//                   </td>
//                   <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2,whiteSpace:"nowrap"}}>{fmtTime(r.timestamp)}</td>
//                   <td style={{fontWeight:600,color:T.t0,fontSize:14}}>{r.project}</td>
//                   <td className="hide-mobile"><span className="badge badge-muted">{r.cluster}</span></td>
//                   <td><span className="badge badge-info">{r.script_type}</span></td>
//                   <td><span className="badge badge-gold">{r.build_number?`#${r.build_number}`:"—"}</span></td>
//                   <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,whiteSpace:"nowrap"}}>
//                     <span style={{color:T.success,fontWeight:600}}>{r.passed_steps}✓</span>
//                     {r.failed_steps>0&&<span style={{color:T.danger,fontWeight:600,marginLeft:7}}>{r.failed_steps}✗</span>}
//                     <span style={{color:T.t3,marginLeft:5}}>/{r.total_steps}</span>
//                   </td>
//                   <td className="hide-mobile" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2}}>{fmtDur(r.total_duration)}</td>
//                   <td><span className={`badge ${r.has_failure?"badge-fail":"badge-ok"}`}>{r.has_failure?"Failed":"Passed"}</span></td>
//                 </tr>,
//                 open&&(
//                   <tr key={r._id+"-e"}>
//                     <td colSpan={9} style={{padding:"0 16px 16px 52px",background:T.cardBg2}}>
//                       <div style={{paddingTop:14}}>
//                         <div style={{fontSize:13,fontWeight:600,color:T.t2,marginBottom:10}}>Step execution trace</div>
//                         <div style={{display:"flex",flexDirection:"column",gap:5}}>
//                           {r.steps?.map((s,si)=>(
//                             <div key={si} style={{
//                               display:"flex",alignItems:"center",gap:13,padding:"11px 14px",borderRadius:8,
//                               background:!s.is_success?T.dangerBg:T.cardBg,
//                               border:`1px solid ${!s.is_success?T.danger+"40":T.border}`,
//                               animation:!s.is_success?"borderPop 3s ease infinite":undefined,
//                             }}>
//                               <span style={{fontSize:15,fontWeight:700,color:!s.is_success?T.danger:T.success,minWidth:18,textAlign:"center"}}>{!s.is_success?"✗":"✓"}</span>
//                               <span style={{flex:1,fontSize:14,color:!s.is_success?T.t0:T.t1,fontWeight:!s.is_success?600:400}}>{s.step}</span>
//                               <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:statusC(s.status_code,T),fontWeight:600,flexShrink:0}}>{s.status_code}</span>
//                               <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,color:T.t2,minWidth:58,textAlign:"right",flexShrink:0}}>{s.response_time?.toFixed(2)}s</span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </td>
//                   </tr>
//                 ),
//               ].filter(Boolean);
//             })}
//           </tbody>
//         </table>
//       </div>
//       {pages>1&&(
//         <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,padding:"16px",borderTop:`1px solid ${T.border}`}}>
//           <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
//           <span style={{fontSize:14,color:T.t2,fontFamily:"'IBM Plex Mono',monospace"}}>Page {page} / {pages}</span>
//           <button className="btn" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Next →</button>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── STEP ANALYTICS ──────────────────────────────────────────── */
// function StepAnalytics({ summary, T }) {
//   const steps=[...(summary?.by_step||[])].sort((a,b)=>(b.failures||0)-(a.failures||0));
//   if(!steps.length) return <div style={{padding:"44px",textAlign:"center",color:T.t2,fontSize:14}}>No step data available.</div>;
//   return (
//     <div style={{display:"flex",flexDirection:"column"}}>
//       {steps.map((s,i)=>{
//         const rate=parseFloat(s.failure_rate)||0, col=healthC(rate,T);
//         return (
//           <div key={s._id} className="fu" style={{
//             display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",
//             padding:"14px 20px",borderBottom:`1px solid ${T.border}`,
//             animationDelay:`${i*22}ms`,
//           }}>
//             <div style={{flex:1,minWidth:200}}>
//               <div style={{fontSize:14,fontWeight:600,color:T.t0,marginBottom:2}}>{s._id}</div>
//               <div style={{fontSize:13,color:T.t3}}>Last: {s.last_run?fmtTime(s.last_run):"—"}</div>
//             </div>
//             <div style={{display:"flex",gap:24,alignItems:"center",flexWrap:"wrap"}}>
//               {[{l:"Total",v:s.total,c:T.t1},{l:"Failures",v:s.failures,c:s.failures>0?T.danger:T.t3},{l:"Avg time",v:`${s.avg_response_time?.toFixed(2)}s`,c:T.info,mono:true}].map(x=>(
//                 <div key={x.l} style={{textAlign:"center",minWidth:52}}>
//                   <div style={{fontSize:19,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.01em",fontFamily:x.mono?"'IBM Plex Mono',monospace":undefined}}>{x.v}</div>
//                   <div style={{fontSize:11,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
//                 </div>
//               ))}
//             </div>
//             <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200}}>
//               <div style={{flex:1,height:5,background:T.cardBg2,borderRadius:99,overflow:"hidden"}}>
//                 <div style={{width:`${Math.min(rate,100)}%`,height:"100%",background:col,borderRadius:99,transition:"width 1.1s ease"}}/>
//               </div>
//               <span style={{fontSize:13,color:col,fontWeight:700,minWidth:44,fontFamily:"'IBM Plex Mono',monospace"}}>{fmtPct(rate)}</span>
//               <span className={`badge ${rate===0?"badge-ok":rate<20?"badge-warn":"badge-fail"}`} style={{fontSize:12}}>{rate===0?"OK":rate<20?"Warn":"Fail"}</span>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ─── BUILD TRACKER ───────────────────────────────────────────── */
// function BuildTracker({ results, T }) {
//   const builds={};
//   results.forEach(r=>{
//     const b=r.build_number||"Unknown";
//     if(!builds[b]) builds[b]={runs:0,fails:0,projects:new Set(),failedSteps:[],firstSeen:r.timestamp,lastSeen:r.timestamp};
//     builds[b].runs++; if(r.has_failure){builds[b].fails++; r.steps?.filter(s=>!s.is_success).forEach(s=>builds[b].failedSteps.push({step:s.step,project:r.project}));}
//     builds[b].projects.add(r.project);
//     if(new Date(r.timestamp)>new Date(builds[b].lastSeen)) builds[b].lastSeen=r.timestamp;
//   });
//   return (
//     <div style={{display:"flex",flexDirection:"column",gap:12}}>
//       {Object.entries(builds).sort((a,b)=>new Date(b[1].lastSeen)-new Date(a[1].lastSeen)).map(([build,d],i)=>{
//         const clean=d.fails===0;
//         return (
//           <div key={build} className="card fu" style={{padding:"18px 22px",animationDelay:`${i*45}ms`,borderLeft:`3px solid ${clean?T.success:T.danger}`}}>
//             <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
//               <div style={{minWidth:110}}>
//                 <div style={{fontSize:12,color:T.t3,fontWeight:500,marginBottom:3}}>Build Number</div>
//                 <div style={{fontSize:24,fontWeight:700,color:T.gold,letterSpacing:"-0.03em",fontFamily:"'IBM Plex Mono',monospace"}}>#{build}</div>
//               </div>
//               <div style={{flex:1,minWidth:160}}>
//                 <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:5}}>{[...d.projects].map(p=><span key={p} className="badge badge-info">{p}</span>)}</div>
//                 <div style={{fontSize:13,color:T.t3}}>{fmtTime(d.firstSeen)} → {fmtTime(d.lastSeen)}</div>
//               </div>
//               <div style={{display:"flex",gap:24}}>
//                 {[{l:"Runs",v:d.runs,c:T.accent},{l:"Failed",v:d.fails,c:clean?T.t3:T.danger}].map(x=>(
//                   <div key={x.l} style={{textAlign:"center"}}>
//                     <div style={{fontSize:26,fontWeight:700,color:x.c,lineHeight:1,letterSpacing:"-0.03em"}}>{x.v}</div>
//                     <div style={{fontSize:12,color:T.t3,marginTop:3,fontWeight:500}}>{x.l}</div>
//                   </div>
//                 ))}
//               </div>
//               <span className={`badge ${clean?"badge-ok":"badge-fail"}`} style={{fontSize:13}}>{clean?"Clean build":`${d.failedSteps.length} failure${d.failedSteps.length>1?"s":""}`}</span>
//             </div>
//             {d.failedSteps.length>0&&(
//               <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
//                 <div style={{fontSize:13,fontWeight:600,color:T.t1,marginBottom:8}}>Failed steps in this build</div>
//                 <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
//                   {[...new Map(d.failedSteps.map(s=>[s.step+s.project,s])).values()].map((s,si)=>(
//                     <div key={si} style={{fontSize:13,color:T.danger,background:T.dangerBg,border:`1px solid ${T.danger}35`,borderRadius:7,padding:"4px 12px"}}>
//                       <span style={{color:T.t2,fontSize:12}}>{s.project} / </span>{s.step}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// /* ─── OVERVIEW ────────────────────────────────────────────────── */
// function Overview({ summary, results, T }) {
//   const kpi=summary?.kpi||{};
//   const spark7=useMemo(()=>{const m={}; results.forEach(r=>{const d=new Date(r.timestamp).toDateString(); m[d]=(m[d]||0)+(r.failed_steps||0);}); return Object.values(m).slice(-7);},[results]);
//   const sparkR=useMemo(()=>{const m={}; results.forEach(r=>{const d=new Date(r.timestamp).toDateString(); m[d]=(m[d]||0)+1;}); return Object.values(m).slice(-7);},[results]);
//   const fr=parseFloat(kpi.overall_failure_rate)||0;
//   return (
//     <div style={{display:"flex",flexDirection:"column",gap:24}}>
//       <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:14}}>
//         {[
//           {label:"Total Script Runs",  value:kpi.total_runs||0,         color:T.accent,  spark:sparkR,sub:"All products combined"},
//           {label:"Failed Runs",        value:kpi.failed_runs||0,        color:T.danger,  spark:spark7,sub:"Runs with failures"},
//           {label:"Step Executions",    value:kpi.total_steps_run||0,    color:T.warn,    sub:"Total step checks"},
//           {label:"Step Failures",      value:kpi.total_failures||0,     color:T.danger,  sub:"Individual step fails"},
//           {label:"Failure Rate",       value:fr,dec:1,suffix:"%",       color:healthC(fr,T),sub:"Overall health"},
//           {label:"Avg Script Duration",value:kpi.avg_duration||0,dec:1,suffix:"s",color:T.info,sub:"Seconds per run"},
//         ].map((c,i)=><KpiCard key={c.label} {...c} delay={i*50} T={T}/>)}
//       </div>
//       <Section title="Product Health" sub="Live status per product" T={T}>
//         <div style={{padding:"20px"}}><ProductGrid results={results} T={T}/></div>
//       </Section>
//       <Section title="Active Failures" sub="Steps currently failing — sorted by impact" T={T}>
//         <FailTable summary={summary} T={T}/>
//       </Section>
//     </div>
//   );
// }


// /* ─── ARC AI PAGE ─────────────────────────────────────────────── */
// function ArcAIPage({ results, T }) {
//   const [expanded, setExpanded] = useState(null);
//   const [tab,      setTab]      = useState("runs");
//   const [page,     setPage]     = useState(1);
//   const [search,   setSearch]   = useState("");
//   const PER = 15;

//   const AI = {
//     accent:    "#6366F1",
//     accentBg:  T.mode === "dark" ? "rgba(99,102,241,0.13)" : "#EEF2FF",
//     accentBdr: T.mode === "dark" ? "rgba(99,102,241,0.32)" : "rgba(99,102,241,0.28)",
//     purple:    "#8B5CF6",
//     purpleBg:  T.mode === "dark" ? "rgba(139,92,246,0.12)" : "#F5F3FF",
//   };

//   /* ── All ARC AI runs from shared results array ──
//      Match: project name contains "arc ai" (case-insensitive)
//      OR script_type === "ai"
//      No separate fetch needed — same MongoDB collection, same data.results  */
//   const aiRuns = useMemo(() => {
//     return results.filter(r => {
//       const proj = (r.project || "").toLowerCase();
//       return proj.includes("arc ai") || proj.startsWith("arc ai") || r.script_type === "ai";
//     });
//   }, [results]);

//   /* ── All error steps across AI runs ── */
//   const errorSteps = useMemo(() => {
//     const list = [];
//     aiRuns.forEach(r => {
//       (r.steps || []).forEach(s => {
//         if (s.error_msg || !s.is_success) {
//           list.push({
//             project:   r.project,
//             build:     r.build_number,
//             cluster:   r.cluster,
//             run_ts:    r.timestamp,
//             step:      s.step,
//             status:    s.status_code,
//             success:   s.is_success,
//             resp_time: s.response_time,
//             error_msg: s.error_msg  || "",
//             resp_body: s.response_body || "",
//           });
//         }
//       });
//     });
//     return list.sort((a, b) => new Date(b.run_ts) - new Date(a.run_ts));
//   }, [aiRuns]);

//   /* ── KPIs ── */
//   const totalRuns    = aiRuns.length;
//   const failedRuns   = aiRuns.filter(r => r.has_failure).length;
//   const totalSteps   = aiRuns.reduce((s, r) => s + (r.total_steps  || 0), 0);
//   const totalFailed  = aiRuns.reduce((s, r) => s + (r.failed_steps || 0), 0);
//   const failRate     = totalSteps > 0 ? ((totalFailed / totalSteps) * 100).toFixed(1) : "0.0";

//   /* ── Filtered list for current tab ── */
//   const filtered = useMemo(() => {
//     const q = search.toLowerCase();
//     if (tab === "runs") {
//       return q
//         ? aiRuns.filter(r => r.project?.toLowerCase().includes(q) || r.build_number?.includes(q) || r.cluster?.toLowerCase().includes(q))
//         : aiRuns;
//     } else {
//       return q
//         ? errorSteps.filter(e => e.step?.toLowerCase().includes(q) || e.error_msg?.toLowerCase().includes(q) || e.project?.toLowerCase().includes(q))
//         : errorSteps;
//     }
//   }, [tab, aiRuns, errorSteps, search]);

//   const totalPages  = Math.ceil(filtered.length / PER);
//   const visible     = filtered.slice((page - 1) * PER, page * PER);

//   const switchTab = (t) => { setTab(t); setPage(1); setSearch(""); setExpanded(null); };

//   /* ── Empty state ── */
//   if (totalRuns === 0) return (
//     <div className="card fu" style={{ padding: "60px 24px", textAlign: "center" }}>
//       <div style={{ fontSize: 44, marginBottom: 14 }}>⬡</div>
//       <div style={{ fontSize: 18, fontWeight: 700, color: T.t0, marginBottom: 8 }}>No ARC AI runs yet</div>
//       <div style={{ fontSize: 14, color: T.t2, maxWidth: 460, margin: "0 auto", lineHeight: 1.7 }}>
//         Push data from your ARC AI scripts to the same API endpoint.
//         Make sure the <code style={{ background: T.cardBg2, padding: "1px 7px", borderRadius: 4, fontSize: 13 }}>project</code> field
//         contains <strong style={{ color: AI.accent }}>"ARC AI"</strong> — e.g. <em>"ARC AI Facilities"</em>.
//       </div>
//       <div style={{
//         marginTop: 24, padding: "14px 20px", background: AI.accentBg,
//         border: `1px solid ${AI.accentBdr}`, borderRadius: 10,
//         display: "inline-block", textAlign: "left", maxWidth: 460,
//       }}>
//         <div style={{ fontSize: 12, color: AI.accent, fontWeight: 700, marginBottom: 8, letterSpacing: "0.04em" }}>
//           SAMPLE PROJECT NAMES THAT WILL APPEAR HERE
//         </div>
//         {["ARC AI Facilities", "ARC AI SiteSite", "ARC AI Projects"].map(n => (
//           <div key={n} style={{ fontSize: 13, color: T.t1, fontFamily: "'IBM Plex Mono',monospace", marginBottom: 3 }}>
//             "{n}"
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

//       {/* ── KPI row ── */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
//         {[
//           { label: "AI Script Runs",  value: totalRuns,   color: AI.accent  },
//           { label: "Failed Runs",     value: failedRuns,  color: T.danger   },
//           { label: "Steps Checked",   value: totalSteps,  color: T.warn     },
//           { label: "Step Failures",   value: totalFailed, color: T.danger   },
//           { label: "Failure Rate",    value: failRate,    color: healthC(parseFloat(failRate), T), suffix: "%" },
//         ].map((k, i) => (
//           <div key={k.label} className="card fu" style={{ padding: "16px 18px", animationDelay: `${i * 45}ms`, borderTop: `2.5px solid ${k.color}` }}>
//             <div style={{ fontSize: 28, fontWeight: 700, color: k.color, letterSpacing: "-0.03em", lineHeight: 1 }}>
//               <Counter to={parseFloat(k.value)} dec={k.suffix ? 1 : 0} suffix={k.suffix || ""} />
//             </div>
//             <div style={{ fontSize: 13, fontWeight: 600, color: T.t1, marginTop: 6 }}>{k.label}</div>
//           </div>
//         ))}
//       </div>

//       {/* ── Tab bar + search ── */}
//       <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
//         {/* Tabs */}
//         <div style={{
//           display: "flex", alignItems: "center", gap: 0,
//           background: T.cardBg2, border: `1px solid ${T.border}`,
//           borderRadius: 10, padding: 3, flexShrink: 0,
//         }}>
//           {[
//             { id: "runs",   label: `Run History (${aiRuns.length})` },
//             { id: "errors", label: `Error Log (${errorSteps.length})` },
//           ].map(t => (
//             <button key={t.id} onClick={() => switchTab(t.id)} style={{
//               padding: "7px 18px", borderRadius: 7, border: "none",
//               background: tab === t.id ? T.cardBg : "transparent",
//               color: tab === t.id ? AI.accent : T.t2,
//               fontWeight: tab === t.id ? 600 : 400,
//               fontSize: 14, cursor: "pointer",
//               fontFamily: "'Inter',sans-serif",
//               boxShadow: tab === t.id ? T.shadow : "none",
//               transition: "all .15s",
//             }}>{t.label}</button>
//           ))}
//         </div>

//         {/* Search */}
//         <input
//           placeholder={tab === "runs" ? "Search project, build, cluster…" : "Search step, error, project…"}
//           value={search}
//           onChange={e => { setSearch(e.target.value); setPage(1); }}
//           style={{ flex: 1, minWidth: 200, fontSize: 14 }}
//         />

//         {search && (
//           <button className="btn ghost" onClick={() => setSearch("")} style={{ fontSize: 13 }}>Clear ×</button>
//         )}
//       </div>

//       {/* ── RUN HISTORY tab ── */}
//       {tab === "runs" && (
//         <div className="card" style={{ overflow: "hidden" }}>
//           <div style={{
//             display: "flex", alignItems: "center", justifyContent: "space-between",
//             padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.cardBg2,
//           }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <div style={{ width: 8, height: 8, borderRadius: "50%", background: AI.accent }} />
//               <span style={{ fontSize: 15, fontWeight: 700, color: T.t0 }}>ARC AI — Run History</span>
//             </div>
//             <span className="badge" style={{ background: AI.accentBg, color: AI.accent, border: `1px solid ${AI.accentBdr}` }}>
//               {filtered.length} runs
//             </span>
//           </div>

//           {filtered.length === 0 ? (
//             <div style={{ padding: "40px", textAlign: "center", color: T.t3, fontSize: 14 }}>No runs match your search.</div>
//           ) : (
//             <div style={{ overflowX: "auto" }}>
//               <table>
//                 <thead>
//                   <tr>
//                     <th style={{ width: 24 }} />
//                     <th>Timestamp</th>
//                     <th>Project</th>
//                     <th>Cluster</th>
//                     <th>Build</th>
//                     <th>Steps</th>
//                     <th>Duration</th>
//                     <th>Result</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {visible.map(r => {
//                     const open = expanded === r._id;
//                     return [
//                       <tr key={r._id} onClick={() => setExpanded(open ? null : r._id)}
//                         style={{ cursor: "pointer", background: open ? AI.accentBg : undefined }}>
//                         <td style={{ textAlign: "center", color: T.t3, fontSize: 12 }}>
//                           <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s" }}>▶</span>
//                         </td>
//                         <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: T.t2, whiteSpace: "nowrap" }}>{fmtTime(r.timestamp)}</td>
//                         <td style={{ fontWeight: 600, color: T.t0, fontSize: 14 }}>{r.project}</td>
//                         <td><span className="badge badge-muted">{r.cluster || "—"}</span></td>
//                         <td>
//                           <span className="badge" style={{ background: AI.accentBg, color: AI.accent, border: `1px solid ${AI.accentBdr}` }}>
//                             {r.build_number ? `#${r.build_number}` : "—"}
//                           </span>
//                         </td>
//                         <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13 }}>
//                           <span style={{ color: T.success, fontWeight: 600 }}>{r.passed_steps}✓</span>
//                           {r.failed_steps > 0 && <span style={{ color: T.danger, fontWeight: 600, marginLeft: 7 }}>{r.failed_steps}✗</span>}
//                           <span style={{ color: T.t3, marginLeft: 5 }}>/{r.total_steps}</span>
//                         </td>
//                         <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: T.t2 }}>{fmtDur(r.total_duration)}</td>
//                         <td><span className={`badge ${r.has_failure ? "badge-fail" : "badge-ok"}`}>{r.has_failure ? "Failed" : "Passed"}</span></td>
//                       </tr>,
//                       open && (
//                         <tr key={r._id + "-exp"}>
//                           <td colSpan={8} style={{ padding: "0 16px 16px 52px", background: T.cardBg2 }}>
//                             <div style={{ paddingTop: 14 }}>
//                               <div style={{ fontSize: 13, fontWeight: 600, color: T.t2, marginBottom: 10 }}>
//                                 Step trace — AI response details
//                               </div>
//                               <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
//                                 {(r.steps || []).map((s, si) => (
//                                   <div key={si} style={{
//                                     borderRadius: 8, overflow: "hidden",
//                                     border: `1px solid ${!s.is_success ? T.danger + "45" : s.error_msg ? T.warn + "50" : T.border}`,
//                                     background: !s.is_success ? T.dangerBg : s.error_msg ? T.warnBg : T.cardBg,
//                                   }}>
//                                     {/* Step header */}
//                                     <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px" }}>
//                                       <span style={{ fontSize: 14, fontWeight: 700, color: !s.is_success ? T.danger : T.success, minWidth: 18, textAlign: "center" }}>
//                                         {!s.is_success ? "✗" : "✓"}
//                                       </span>
//                                       <span style={{ flex: 1, fontSize: 14, color: T.t0, fontWeight: !s.is_success ? 600 : 400 }}>{s.step}</span>
//                                       <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: T.t2 }}>{s.response_time?.toFixed(2)}s</span>
//                                       <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: s.status_code?.startsWith("2") ? T.success : T.danger, fontWeight: 600, minWidth: 36, textAlign: "right" }}>
//                                         {s.status_code}
//                                       </span>
//                                     </div>
//                                     {/* error_msg */}
//                                     {s.error_msg && (
//                                       <div style={{ margin: "0 14px 10px", padding: "10px 12px", background: T.mode === "dark" ? "rgba(248,113,113,0.08)" : "#FFF5F5", border: `1px solid ${T.danger}30`, borderRadius: 6 }}>
//                                         <div style={{ fontSize: 11, fontWeight: 700, color: T.danger, letterSpacing: "0.06em", marginBottom: 4 }}>ERROR MESSAGE</div>
//                                         <div style={{ fontSize: 13, color: T.t0, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.55, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
//                                           {s.error_msg}
//                                         </div>
//                                       </div>
//                                     )}
//                                     {/* response_body */}
//                                     {s.response_body && <ResponseBodyBlock body={s.response_body} T={T} AI={AI} />}
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       ),
//                     ].filter(Boolean);
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           )}
//           {totalPages > 1 && <Paginator page={page} pages={totalPages} setPage={setPage} T={T} />}
//         </div>
//       )}

//       {/* ── ERROR LOG tab ── */}
//       {tab === "errors" && (
//         <div className="card" style={{ overflow: "hidden" }}>
//           <div style={{
//             display: "flex", alignItems: "center", justifyContent: "space-between",
//             padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.cardBg2,
//           }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.danger }} />
//               <span style={{ fontSize: 15, fontWeight: 700, color: T.t0 }}>ARC AI — Error Log</span>
//             </div>
//             <span className="badge badge-fail">{filtered.length} entries</span>
//           </div>

//           {filtered.length === 0 ? (
//             <div style={{ textAlign: "center", padding: "52px", color: T.t3 }}>
//               <div style={{ fontSize: 32, marginBottom: 8, color: T.success }}>✓</div>
//               <div style={{ fontSize: 15, fontWeight: 600, color: T.success }}>No errors logged</div>
//               <div style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>All AI step executions passed without errors</div>
//             </div>
//           ) : (
//             <div style={{ overflowX: "auto" }}>
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Timestamp</th>
//                     <th>Project</th>
//                     <th>Build</th>
//                     <th>Step</th>
//                     <th>Status</th>
//                     <th>Response Time</th>
//                     <th>Error Message</th>
//                     <th>Response Body</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {visible.map((e, i) => (
//                     <tr key={i} className="sr" style={{ animationDelay: `${i * 16}ms` }}>
//                       <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: T.t2, whiteSpace: "nowrap" }}>{fmtTime(e.run_ts)}</td>
//                       <td style={{ fontWeight: 600, color: T.t0, fontSize: 13 }}>{e.project}</td>
//                       <td>
//                         <span className="badge" style={{ background: AI.accentBg, color: AI.accent, border: `1px solid ${AI.accentBdr}` }}>
//                           {e.build ? `#${e.build}` : "—"}
//                         </span>
//                       </td>
//                       <td style={{ fontWeight: 500, color: T.t0, fontSize: 13, maxWidth: 180 }}>
//                         <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.step}</div>
//                       </td>
//                       <td><span className={`badge ${e.success ? "badge-ok" : "badge-fail"}`}>{e.status}</span></td>
//                       <td style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: T.t2 }}>{e.resp_time?.toFixed(2)}s</td>
//                       <td style={{ maxWidth: 260 }}>
//                         {e.error_msg ? (
//                           <div style={{
//                             fontSize: 12, color: T.danger, fontFamily: "'IBM Plex Mono',monospace",
//                             background: T.dangerBg, borderRadius: 5, padding: "4px 8px",
//                             overflow: "hidden", display: "-webkit-box",
//                             WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
//                           }}>{e.error_msg}</div>
//                         ) : <span style={{ color: T.t3, fontSize: 12 }}>—</span>}
//                       </td>
//                       <td>
//                         {e.resp_body
//                           ? <span className="badge badge-info" title={e.resp_body} style={{ cursor: "default", fontSize: 11 }}>Available ↗</span>
//                           : <span style={{ color: T.t3, fontSize: 12 }}>—</span>}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//           {totalPages > 1 && <Paginator page={page} pages={totalPages} setPage={setPage} T={T} />}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ─── RESPONSE BODY COLLAPSIBLE ───────────────────────────────── */
// function ResponseBodyBlock({ body, T, AI }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div style={{margin:"0 14px 10px"}}>
//       <button onClick={()=>setOpen(o=>!o)} style={{
//         display:"flex",alignItems:"center",gap:6,
//         background:"transparent",border:"none",cursor:"pointer",
//         padding:"4px 0",fontSize:12,color:AI.accent,fontWeight:600,
//         fontFamily:"'Inter',sans-serif",
//       }}>
//         <span style={{display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .18s"}}>▶</span>
//         Response Body {open?"▲":"▼"}
//       </button>
//       {open && (
//         <pre style={{
//           marginTop:6,padding:"10px 12px",
//           background:T.mode==="dark"?"rgba(99,102,241,0.08)":"#F5F3FF",
//           border:`1px solid ${AI.accentBdr}`,borderRadius:6,
//           fontSize:12,color:T.t1,fontFamily:"'IBM Plex Mono',monospace",
//           lineHeight:1.6,overflowX:"auto",whiteSpace:"pre-wrap",
//           wordBreak:"break-word",maxHeight:200,overflow:"auto",
//           animation:"fadeIn .18s ease",
//         }}>
//           {body}
//         </pre>
//       )}
//     </div>
//   );
// }

// /* ─── SHARED PAGINATOR ────────────────────────────────────────── */
// function Paginator({ page, pages, setPage, T }) {
//   return (
//     <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:10,
//       padding:"14px",borderTop:`1px solid ${T.border}`}}>
//       <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
//       <span style={{fontSize:14,color:T.t2,fontFamily:"'IBM Plex Mono',monospace"}}>Page {page} / {pages}</span>
//       <button className="btn" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages}>Next →</button>
//     </div>
//   );
// }

// /* ─── PAGE META ───────────────────────────────────────────────── */
// const PAGES={
//   overview:{title:"Overview",        sub:"System-wide health metrics"},
//   failures:{title:"Failure Tracker", sub:"All steps with recorded failures"},
//   products:{title:"Products",        sub:"Per-product health breakdown"},
//   runs:    {title:"Run History",     sub:"Full execution log — click any row to expand"},
//   steps:   {title:"Step Analytics",  sub:"Failure rate and response time per step"},
//   builds:  {title:"Build Tracker",   sub:"Trace failures to specific build numbers"},
//   arcai:   {title:"ARC AI Monitor",  sub:"AI script runs — with response body and error diagnostics"},
// };

// /* ─── APP ─────────────────────────────────────────────────────── */
// export default function App() {
//   const [page,setPage]         = useState("overview");
//   const [filters,setFilters]   = useState({});
//   const [data,setData]         = useState({results:[],summary:null,projects:[],clusters:[]});
//   const [loading,setLoading]   = useState(true);
//   const [waking,setWaking]     = useState(false);
//   const [error,setError]       = useState(null);
//   const [lastUpdated,setLastUpdated] = useState(null);
//   const [isDark,setDark]       = useState(()=>{
//     try{ return localStorage.getItem("arc-theme")==="light"?false:true; }catch{ return true; }
//   });

//   const T = isDark ? DARK : LIGHT;

//   useEffect(()=>{ try{ localStorage.setItem("arc-theme",isDark?"dark":"light"); }catch{} },[isDark]);

//   const buildQS=useCallback((extra={})=>{
//     const p=new URLSearchParams();
//     const SKIP=new Set(["_preset"]); // UI-only keys — never sent to API
//     Object.entries({...filters,...extra}).forEach(([k,v])=>{
//       if(v && !SKIP.has(k)) p.set(k,v);
//     });
//     return p.toString();
//   },[filters]);

//   const fetchData=useCallback(async(isWake=false)=>{
//     try{
//       setError(null); if(isWake)setWaking(true);
//       const h={Authorization:`Bearer ${TOKEN}`};
//       const [rR,sR,pR]=await Promise.all([
//         apiFetch(`${API_BASE}/api/results?${buildQS({limit:200})}`,{headers:h}),
//         apiFetch(`${API_BASE}/api/results/summary?${buildQS()}`,{headers:h}),
//         apiFetch(`${API_BASE}/api/results/projects`,{headers:h}),
//       ]);
//       const [rD,sD,pD]=await Promise.all([rR.json(),sR.json(),pR.json()]);
//       setData({results:rD.results||[],summary:sD,projects:pD.projects||[],clusters:pD.clusters||[]});
//       setLastUpdated(new Date());
//     }catch(e){ setError(e.message); }
//     finally{ setLoading(false); setWaking(false); }
//   },[buildQS]);

//   useEffect(()=>{ fetchData(); const iv=setInterval(fetchData,POLL_MS); return()=>clearInterval(iv); },[fetchData]);

//   const failCount=data.results.filter(r=>r.has_failure).length;
//   const meta=PAGES[page];

//   return (
//     <>
//       <style>{makeCSS(T)}</style>
//       <div style={{display:"flex",minHeight:"100vh",background:T.pageBg}}>
//         <Sidebar active={page} set={setPage} failCount={failCount} T={T}/>
//         <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
//           <Topbar
//             lastUpdated={lastUpdated} loading={loading} onRefresh={()=>fetchData(true)}
//             filters={filters} setFilters={setFilters}
//             projects={data.projects} clusters={data.clusters}
//             T={T} isDark={isDark} setDark={setDark}
//           />
//           <main className="main-content" style={{flex:1,padding:"28px 28px",overflow:"auto"}}>

//             {/* Page header */}
//             <div className="fu" style={{marginBottom:24}}>
//               <h1 style={{fontSize:24,fontWeight:700,color:T.t0,letterSpacing:"-0.02em"}}>{meta.title}</h1>
//               <p style={{fontSize:14,color:T.t2,marginTop:4}}>{meta.sub}</p>
//             </div>

//             {/* Wake-up banner */}
//             {waking&&<WakeBanner T={T}/>}

//             {/* Error */}
//             {error&&!waking&&(
//               <div className="card" style={{padding:"16px 20px",marginBottom:20,border:`1px solid ${T.danger}44`,background:T.dangerBg,display:"flex",alignItems:"flex-start",gap:12}}>
//                 <span style={{fontSize:20,flexShrink:0}}>⚠</span>
//                 <div style={{flex:1}}>
//                   <div style={{fontSize:15,fontWeight:600,color:T.danger}}>Cannot reach API</div>
//                   <div style={{fontSize:14,color:T.t1,marginTop:2}}>{error}</div>
//                   <div style={{fontSize:13,color:T.t2,marginTop:4}}>The server may be starting up. Retrying automatically in the background.</div>
//                 </div>
//                 <button className="btn" onClick={()=>fetchData(true)} style={{flexShrink:0}}>Retry</button>
//               </div>
//             )}

//             {/* Skeleton loader */}
//             {loading?(
//               <div style={{display:"flex",flexDirection:"column",gap:16}}>
//                 <div className="kpi-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:14}}>
//                   {Array.from({length:6}).map((_,i)=>(
//                     <div key={i} className="card" style={{padding:"20px",height:116}}>
//                       <div className="skel" style={{height:14,width:"45%",marginBottom:14}}/>
//                       <div className="skel" style={{height:34,width:"60%",marginBottom:10}}/>
//                       <div className="skel" style={{height:12,width:"75%"}}/>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="card skel" style={{height:220}}/>
//               </div>
//             ):(
//               <>
//                 {page==="overview"&&<Overview summary={data.summary} results={data.results} T={T}/>}
//                 {page==="failures"&&<Section title="All Failure Events" sub={`${data.summary?.by_step?.filter(s=>s.failures>0).length||0} steps with recorded failures`} T={T}><FailTable summary={data.summary} T={T}/></Section>}
//                 {page==="products"&&<div className="fu"><ProductGrid results={data.results} T={T}/></div>}
//                 {page==="runs"&&<Section title="Execution Log" sub={`${data.results.length} total runs`} T={T}><RunHistory results={data.results} T={T}/></Section>}
//                 {page==="steps"&&<Section title="Step-Level Analytics" sub="Sorted by failure count" T={T}><StepAnalytics summary={data.summary} T={T}/></Section>}
//                 {page==="builds"&&<div className="fu"><BuildTracker results={data.results} T={T}/></div>}
//                 {page==="arcai"&&<div className="fu"><ArcAIPage results={data.results} T={T}/></div>}
//               </>
//             )}
//           </main>
//         </div>
//       </div>
//     </>
//   );
// }