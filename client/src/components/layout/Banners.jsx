// src/components/layout/Banners.jsx
import { useEffect, useState } from "react";
import { CloudOff, Loader, RotateCw } from "lucide-react";

/* Render free-tier cold-start banner — behaviour unchanged */
export function WakeBanner() {
  const [p, setP] = useState(0);
  useEffect(() => { const iv = setInterval(() => setP(x => Math.min(x + 2, 92)), 700); return () => clearInterval(iv); }, []);
  return (
    <div className="banner banner-info fu" role="status">
      <div className="banner-icon"><Loader size={16} className="spin" /></div>
      <div className="grow">
        <h4>Server is waking up — retrying automatically</h4>
        <div className="wake-track"><i style={{ width: `${p}%` }} /></div>
        <p className="muted">Render free tier spins down after 15 min of inactivity. Cold start takes ~30 seconds. Hang tight.</p>
      </div>
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  return (
    <div className="banner banner-danger fu" role="alert">
      <div className="banner-icon"><CloudOff size={16} /></div>
      <div className="grow">
        <h4>Cannot reach API</h4>
        <p><code className="inline">{error}</code></p>
        <p className="muted" style={{ marginTop: 4 }}>The server may be starting up. Retrying automatically in the background.</p>
      </div>
      <button className="btn" onClick={onRetry}><RotateCw size={14} /> Retry</button>
    </div>
  );
}
