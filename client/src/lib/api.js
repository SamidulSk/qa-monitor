// src/lib/api.js
// Network layer — moved verbatim from the original App.jsx. Do not change
// retry semantics, base URL resolution or token handling here.

export const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "https://qa-monitor.onrender.com";
export const TOKEN    = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_TOKEN) || "qa_monitor_secret_2026_xK9mP2";
export const POLL_MS  = 30000;

/* ─── RETRY FETCH ─────────────────────────────────────────────── */
export async function apiFetch(url, opts = {}, retries = 4) {
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
