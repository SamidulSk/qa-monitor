// src/lib/constants.js
import {
  LayoutDashboard, TriangleAlert, Boxes, History, ListTree, GitCommitHorizontal, Sparkles,
} from "lucide-react";

export const NAV = [
  { id: "overview", label: "Overview",        sub: "System health",     icon: LayoutDashboard,     group: "Monitoring" },
  { id: "failures", label: "Failure Tracker", sub: "Failed steps",      icon: TriangleAlert,       group: "Monitoring" },
  { id: "arcai",    label: "ARC AI",          sub: "AI script monitor", icon: Sparkles,            group: "Monitoring", ai: true },
  { id: "products", label: "Products",        sub: "Per-product view",  icon: Boxes,               group: "Analytics" },
  { id: "runs",     label: "Run History",     sub: "Execution log",     icon: History,             group: "Analytics" },
  { id: "steps",    label: "Step Analytics",  sub: "Step breakdown",    icon: ListTree,            group: "Analytics" },
  { id: "builds",   label: "Build Tracker",   sub: "Build diagnostics", icon: GitCommitHorizontal, group: "Analytics" },
];

export const PAGES = {
  overview: { title: "Overview",        sub: "System-wide health metrics" },
  failures: { title: "Failure Tracker", sub: "All steps with recorded failures" },
  products: { title: "Products",        sub: "Per-product health breakdown" },
  runs:     { title: "Run History",     sub: "Full execution log — click any row to expand" },
  steps:    { title: "Step Analytics",  sub: "Failure rate and response time per step" },
  builds:   { title: "Build Tracker",   sub: "Trace failures to specific build numbers" },
  arcai:    { title: "ARC AI Monitor",  sub: "AI script runs — with response body and error diagnostics" },
};

export const TIME_PRESETS = [
  { id: "24h", label: "24h" },
  { id: "48h", label: "48h" },
  { id: "3d",  label: "3d" },
  { id: "7d",  label: "7d" },
  { id: "1m",  label: "30d" },
];

/* Unchanged from the original — day granularity, ISO yyyy-mm-dd */
export function presetToFromTo(id) {
  const now   = new Date();
  const toStr = now.toISOString().slice(0, 10);
  const map = { "24h": 1, "48h": 2, "3d": 3, "7d": 7, "1m": 30 };
  if (!map[id]) return { from: "", to: "" };
  const from = new Date(now);
  from.setDate(from.getDate() - map[id]);
  return { from: from.toISOString().slice(0, 10), to: toStr };
}
