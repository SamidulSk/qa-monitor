// src/lib/csv.js — client-side CSV export of data already on screen
const esc = v => {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * @param filename  without extension; a timestamp is appended
 * @param columns   [{ label, get: row => value }]
 */
export function downloadCSV(filename, rows, columns) {
  const lines = [columns.map(c => esc(c.label)).join(",")];
  rows.forEach(r => lines.push(columns.map(c => esc(c.get(r))).join(",")));
  // BOM so Excel opens UTF-8 correctly
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  a.href = url; a.download = `${filename}_${stamp}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
