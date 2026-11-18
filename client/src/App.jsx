// src/App.jsx — application shell
// Data flow is unchanged: useDashboardData() fetches /api/results, /summary and
// /projects with the active filters and polls every 30 s. Pages are pure views.
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDashboardData } from "./hooks/useDashboardData";
import { useNewFailures } from "./hooks/useNewFailures";
import { ThemeContext } from "./lib/theme";
import { NAV, PAGES } from "./lib/constants";
import { countSWW } from "./lib/arcai";

import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { TvBar } from "./components/layout/TvBar";
import { WakeBanner, ErrorBanner } from "./components/layout/Banners";
import { CommandPalette } from "./components/layout/CommandPalette";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { KpiSkeleton } from "./components/ui/KpiCard";
import { Badge } from "./components/ui/primitives";
import { Toasts } from "./components/ui/Toasts";

/* Code-split pages: charts (recharts) load only when a page needs them */
const Overview     = lazy(() => import("./pages/Overview").then(m => ({ default: m.Overview })));
const FailuresPage = lazy(() => import("./pages/SimplePages").then(m => ({ default: m.FailuresPage })));
const ProductsPage = lazy(() => import("./pages/SimplePages").then(m => ({ default: m.ProductsPage })));
const StepsPage    = lazy(() => import("./pages/SimplePages").then(m => ({ default: m.StepsPage })));
const BuildsPage   = lazy(() => import("./pages/SimplePages").then(m => ({ default: m.BuildsPage })));
const RunsPage     = lazy(() => import("./pages/RunsPage").then(m => ({ default: m.RunsPage })));
const ArcAIPage    = lazy(() => import("./pages/ArcAIPage").then(m => ({ default: m.ArcAIPage })));

const TV_PAGES = ["overview", "products", "arcai", "failures"];
const TV_ROTATE_MS = 20000;

const readLS = (k, fallback) => { try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const pageFromHash = () => {
  const h = (typeof window !== "undefined" ? window.location.hash : "").replace("#", "");
  return NAV.some(n => n.id === h) ? h : "overview";
};
const canNotify = () => typeof window !== "undefined" && "Notification" in window;

function LoadingSkeleton() {
  return (
    <div className="stack">
      <div className="kpi-grid">{Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}</div>
      <div className="grid-2-1">
        <div className="panel skel" style={{ height: 320 }} />
        <div className="panel skel" style={{ height: 320 }} />
      </div>
      <div className="panel skel" style={{ height: 220 }} />
    </div>
  );
}

export default function App() {
  const [page, setPage]           = useState(pageFromHash);
  const [filters, setFilters]     = useState({});
  const [isDark, setDark]         = useState(() => readLS("arc-theme", "dark") !== "light");
  const [collapsed, setCollapsed] = useState(() => readLS("arc-sidebar", "") === "collapsed");
  const [notify, setNotify]       = useState(() => readLS("arc-notify", "") === "on");
  const [drawer, setDrawer]       = useState(false);
  const [cmdOpen, setCmdOpen]     = useState(false);
  const [tv, setTv]               = useState(false);
  const [rotating, setRotating]   = useState(true);
  const [focusRun, setFocusRun]   = useState(null);
  const [toasts, setToasts]       = useState([]);
  const toastSeq = useRef(0);

  const { data, loading, waking, error, lastUpdated, fetchData } = useDashboardData(filters);

  /* Theme — same "arc-theme" storage key as before */
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    writeLS("arc-theme", isDark ? "dark" : "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", isDark ? "#08090B" : "#F6F7F9");
  }, [isDark]);
  useEffect(() => { writeLS("arc-sidebar", collapsed ? "collapsed" : ""); }, [collapsed]);
  useEffect(() => { writeLS("arc-notify", notify ? "on" : ""); }, [notify]);

  /* Navigation — deep-linkable pages (#runs, #arcai …) */
  const navigate = useCallback((id) => {
    setPage(id);
    setFocusRun(null);
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }, []);
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const openRun = useCallback((id) => { navigate("runs"); setFocusRun(id); }, [navigate]);
  const selectProduct = useCallback((name) => setFilters(f => ({ ...f, project: name })), []);

  /* Ctrl/⌘+K command palette */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Toasts ── */
  const dismissToast = useCallback(id => setToasts(ts => ts.filter(t => t.id !== id)), []);
  const pushToast = useCallback(t => {
    const id = ++toastSeq.current;
    setToasts(ts => [...ts.slice(-3), { ...t, id }]);
  }, []);

  /* ── New-failure alerts (toast + optional desktop notification) ── */
  const filterKey = JSON.stringify(filters);
  const onNewFailures = useCallback((runs) => {
    const first = runs[0];
    const failedNames = (first.steps || []).filter(s => !s.is_success).map(s => s.step);
    const title = runs.length === 1 ? `New failure · ${first.project}` : `${runs.length} new failed runs`;
    const body = runs.length === 1
      ? `${first.failed_steps}/${first.total_steps} steps failed${failedNames.length ? ` — ${failedNames.slice(0, 2).join(", ")}` : ""}`
      : [...new Set(runs.map(r => r.project))].join(" · ");
    pushToast({ tone: "danger", title, body, ttl: 12000, action: { label: "Inspect", run: () => openRun(first._id) } });
    if (notify && canNotify() && Notification.permission === "granted") {
      try {
        const n = new Notification(title, { body, tag: "qa-monitor-failure", icon: "/icon-192.png" });
        n.onclick = () => { window.focus(); openRun(first._id); n.close(); };
      } catch { /* some browsers only allow notifications from a service worker */ }
    }
  }, [notify, pushToast, openRun]);
  useNewFailures({ results: data.results, lastUpdated, filterKey, onNew: onNewFailures });

  const toggleNotify = useCallback(async () => {
    if (notify) { setNotify(false); pushToast({ tone: "info", title: "Failure alerts off", ttl: 4000 }); return; }
    setNotify(true);
    let perm = canNotify() ? Notification.permission : "unsupported";
    if (perm === "default") { try { perm = await Notification.requestPermission(); } catch { /* ignore */ } }
    pushToast(perm === "granted"
      ? { tone: "success", title: "Failure alerts on", body: "You'll get a desktop notification and an in-app alert for every new failed run.", ttl: 6000 }
      : { tone: "info", title: "In-app alerts on", body: "Desktop notifications are blocked by the browser — alerts will appear here instead.", ttl: 7000 });
  }, [notify, pushToast]);

  /* ── TV / kiosk mode ── */
  const enterTv = useCallback(() => {
    setTv(true); setRotating(true);
    if (!TV_PAGES.includes(page)) navigate("overview");
    document.documentElement.requestFullscreen?.().catch(() => { /* fullscreen not allowed — still use TV layout */ });
  }, [page, navigate]);
  const exitTv = useCallback(() => {
    setTv(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setTv(false); };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  useEffect(() => {
    if (!tv || !rotating) return;
    const id = setTimeout(() => {
      const i = TV_PAGES.indexOf(page);
      navigate(TV_PAGES[(i + 1) % TV_PAGES.length]);
    }, TV_ROTATE_MS);
    return () => clearTimeout(id);
  }, [tv, rotating, page, navigate]);

  const toggleTheme = useCallback(() => setDark(d => !d), []);
  const refresh     = useCallback(() => fetchData(true), [fetchData]);
  const clearFilter = useCallback(() => setFilters({}), []);

  const failCount = data.results.filter(r => r.has_failure).length;
  const swwCount  = useMemo(() => countSWW(data.results), [data.results]);
  const meta = PAGES[page];
  const theme = useMemo(() => ({ isDark, toggle: toggleTheme }), [isDark, toggleTheme]);

  /* Browser-tab title doubles as a status indicator */
  useEffect(() => {
    const alert = swwCount > 0 ? "⚠ SWW · " : failCount > 0 ? `(${failCount}) ` : "";
    document.title = `${alert}${meta.title} · ARC QA Monitor`;
  }, [failCount, swwCount, meta.title]);

  const pageProps = { results: data.results, summary: data.summary };

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`app${tv ? " tv" : ""}`}>
        <Sidebar active={page} onNavigate={navigate} failCount={failCount} swwCount={swwCount}
          collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} online={!error} />
        {drawer && (
          <>
            <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
            <Sidebar drawer active={page} onNavigate={navigate} failCount={failCount} swwCount={swwCount}
              onClose={() => setDrawer(false)} online={!error} />
          </>
        )}

        <div className="app-main">
          {tv && (
            <TvBar page={page} pages={TV_PAGES} rotating={rotating} setRotating={setRotating}
              intervalMs={TV_ROTATE_MS} onExit={exitTv}>
              {error ? <Badge tone="danger" dot>API unreachable</Badge> : <Badge tone="success" dot>Live</Badge>}
            </TvBar>
          )}
          <Topbar
            title={meta.title}
            lastUpdated={lastUpdated} busy={loading || waking} error={error} onRefresh={refresh}
            filters={filters} setFilters={setFilters}
            projects={data.projects} clusters={data.clusters}
            isDark={isDark} toggleTheme={toggleTheme}
            onMenu={() => setDrawer(true)} onCommand={() => setCmdOpen(true)}
            notify={notify} onToggleNotify={toggleNotify} onTv={enterTv}
          />

          <main className="content">
            <div className="page-head fu" key={`head-${page}`}>
              <div>
                <h1>
                  {meta.title}
                  {page === "arcai" && <Badge tone="ai">AI</Badge>}
                </h1>
                <p>{meta.sub}</p>
              </div>
              {filters.project && (
                <div className="page-meta">
                  <Badge tone="info">Product: {filters.project}</Badge>
                </div>
              )}
            </div>

            {waking && <WakeBanner />}
            {error && !waking && <ErrorBanner error={error} onRetry={refresh} />}

            {loading ? <LoadingSkeleton /> : (
              <ErrorBoundary key={page}>
                <Suspense fallback={<LoadingSkeleton />}>
                  {page === "overview" && <Overview {...pageProps} onNavigate={navigate} onOpenRun={openRun}
                    onSelectProduct={selectProduct} activeProduct={filters.project} error={error} lastUpdated={lastUpdated} />}
                  {page === "failures" && <FailuresPage {...pageProps} />}
                  {page === "products" && <ProductsPage {...pageProps} onSelectProduct={selectProduct} activeProduct={filters.project} />}
                  {page === "runs"     && <RunsPage {...pageProps} focusRunId={focusRun} />}
                  {page === "steps"    && <StepsPage {...pageProps} />}
                  {page === "builds"   && <BuildsPage {...pageProps} />}
                  {page === "arcai"    && <ArcAIPage {...pageProps} />}
                </Suspense>
              </ErrorBoundary>
            )}
          </main>
        </div>

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)}
          onNavigate={navigate} onRefresh={refresh} onToggleTheme={toggleTheme} onClearFilters={clearFilter}
          onTv={enterTv} onToggleNotify={toggleNotify} />
        <Toasts toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ThemeContext.Provider>
  );
}
