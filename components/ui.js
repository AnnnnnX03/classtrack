import { useState } from 'react'

// ── Card ─────────────────────────────────────────────
export function Card({ children, style, className = '' }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
      <style jsx>{`
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 20px;
        }
      `}</style>
    </div>
  )
}

// ── Button ─────────────────────────────────────────────
export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, loading, style, fullWidth }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'full' : ''}`}
    >
      {loading ? <span className="spinner" /> : children}
      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-family: var(--font-body);
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn.full { width: 100%; }

        /* Sizes */
        .btn-sm { padding: 8px 14px; font-size: 13px; }
        .btn-md { padding: 12px 20px; font-size: 15px; }
        .btn-lg { padding: 16px 28px; font-size: 17px; }

        /* Variants */
        .btn-primary { background: var(--accent); color: #0a1a14; }
        .btn-primary:hover:not(:disabled) { background: #a7f3d0; transform: translateY(-1px); }

        .btn-danger { background: var(--danger); color: #fff; }
        .btn-danger:hover:not(:disabled) { background: #fca5a5; transform: translateY(-1px); }

        .btn-secondary { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
        .btn-secondary:hover:not(:disabled) { background: var(--border); }

        .btn-ghost { background: transparent; color: var(--text-muted); }
        .btn-ghost:hover:not(:disabled) { color: var(--text); background: var(--surface2); }

        .btn-amber { background: var(--accent2); color: #0a0a00; }
        .btn-amber:hover:not(:disabled) { background: #fcd34d; transform: translateY(-1px); }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}

// ── Input ─────────────────────────────────────────────
export function Input({ label, value, onChange, placeholder, type = 'text', required }) {
  return (
    <div className="field">
      {label && <label>{label}{required && <span className="req">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <style jsx>{`
        .field { display: flex; flex-direction: column; gap: 6px; }
        label { font-size: 13px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
        .req { color: var(--danger); margin-left: 2px; }
        input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 12px 14px;
          font-size: 15px;
          font-family: var(--font-body);
          transition: border-color 0.15s;
          width: 100%;
        }
        input:focus { outline: none; border-color: var(--accent); }
        input::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .badge-default { background: var(--surface2); color: var(--text-muted); }
        .badge-green { background: rgba(110,231,183,0.15); color: var(--accent); }
        .badge-amber { background: rgba(245,158,11,0.15); color: var(--accent2); }
        .badge-red { background: rgba(248,113,113,0.15); color: var(--danger); }
      `}</style>
    </span>
  )
}

// ── Modal ─────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
      <style jsx>{`
        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: flex-end;
          justify-content: center;
          z-index: 100;
          padding: 0;
        }
        @media (min-width: 600px) {
          .overlay { align-items: center; padding: 20px; }
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius) var(--radius) 0 0;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow);
        }
        @media (min-width: 600px) {
          .modal { border-radius: var(--radius); }
        }
        .modal-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 20px;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0;
          background: var(--surface);
        }
        .modal-head h3 { font-size: 18px; font-family: var(--font-head); }
        .close {
          background: none; border: none; color: var(--text-muted);
          font-size: 16px; padding: 4px 8px; border-radius: 4px;
          cursor: pointer;
        }
        .close:hover { color: var(--text); background: var(--surface2); }
        .modal-body { padding: 20px; }
      `}</style>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────
export function Toast({ message, type = 'success', onDone }) {
  return (
    <div className={`toast toast-${type}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <style jsx>{`
        .toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 10px;
          padding: 14px 22px;
          border-radius: 99px;
          font-weight: 500; font-size: 14px;
          z-index: 200;
          animation: toastIn 0.25s ease both;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .toast-success { background: var(--accent); color: #0a1a14; }
        .toast-error { background: var(--danger); color: #fff; }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ── useToast hook ─────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null)
  
  const show = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }
  
  return { toast, show }
}

// ── CreditBar ─────────────────────────────────────────
export function CreditBar({ remaining, total }) {
  const pct = total > 0 ? Math.min((remaining / total) * 100, 100) : 0
  const low = remaining < 3
  const color = low ? 'var(--danger)' : remaining < 5 ? 'var(--accent2)' : 'var(--accent)'
  
  return (
    <div className="bar-wrap">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <style jsx>{`
        .bar-wrap { width: 100%; }
        .bar-track {
          height: 6px;
          background: var(--surface2);
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  )
}

// ── EmptyState ─────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="empty">
      <div className="icon">{icon}</div>
      <div className="title">{title}</div>
      {subtitle && <div className="sub">{subtitle}</div>}
      <style jsx>{`
        .empty {
          text-align: center;
          padding: 48px 20px;
          color: var(--text-muted);
        }
        .icon { font-size: 40px; margin-bottom: 12px; }
        .title { font-size: 16px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
        .sub { font-size: 14px; }
      `}</style>
    </div>
  )
}
