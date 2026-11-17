// src/components/ErrorBoundary.jsx
// Contains a render crash to the current page so the shell, polling and
// navigation keep working.
import { Component } from "react";
import { Bug, RotateCw } from "lucide-react";

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("Page render error:", error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel">
        <div className="empty">
          <div className="empty-icon" style={{ color: "var(--danger)" }}><Bug size={20} /></div>
          <h4>This view hit an unexpected error</h4>
          <p>The rest of the dashboard is still live. <code className="inline">{String(this.state.error?.message || this.state.error)}</code></p>
          <button className="btn" style={{ marginTop: 10 }} onClick={() => this.setState({ error: null })}>
            <RotateCw size={14} /> Try again
          </button>
        </div>
      </div>
    );
  }
}
