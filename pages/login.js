import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState('login')
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (!loading && user) router.push('/')
  }, [user, loading])

  async function handleSubmit() {
    setError('')
    setSubmitting(true)

    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      })
      if (error) setError(error.message)
      else setResetSent(true)
      setSubmitting(false)
      return
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setError('Check your email to confirm your account, then log in.')
    }
    setSubmitting(false)
  }

  if (loading) return null

  return (
    <div className="page">
      <div className="card">

        {/* Logo */}
        <div className="brand">
          <div className="logo-wrap">
            <Image src="/logo.png" alt="AiCAMP" width={72} height={72} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="brand-name">AiCAMP</h1>
          <p className="brand-sub">Class Track</p>
          <p className="brand-tagline">Student credit management system</p>
        </div>

        {mode === 'reset' ? (
          resetSent ? (
            <div className="success-box">
              <div className="success-icon">✓</div>
              <p>Password reset link sent! Check your email.</p>
              <button className="link-btn" onClick={() => { setMode('login'); setResetSent(false) }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h2 className="form-title">Reset Password</h2>
              <div className="field">
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
              </div>
              {error && <div className="error-msg">{error}</div>}
              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send Reset Link'}
              </button>
              <button className="link-btn" onClick={() => setMode('login')}>Back to sign in</button>
            </>
          )
        ) : (
          <>
            <h2 className="form-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {error && (
              <div className={error.startsWith('Check') ? 'success-msg' : 'error-msg'}>{error}</div>
            )}

            <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            <div className="footer-links">
              {mode === 'login' ? (
                <>
                  <button className="link-btn" onClick={() => { setMode('signup'); setError('') }}>
                    New user? Create account
                  </button>
                  <button className="link-btn" onClick={() => { setMode('reset'); setError('') }}>
                    Forgot password?
                  </button>
                </>
              ) : (
                <button className="link-btn" onClick={() => { setMode('login'); setError('') }}>
                  Already have an account? Sign in
                </button>
              )}
            </div>

            <div className="roles-info">
              <div className="roles-title">Access levels</div>
              <div className="role-row"><span className="role-badge parent">Parent</span> View your child's credits</div>
              <div className="role-row"><span className="role-badge teacher">Teacher</span> Check students in &amp; out</div>
              <div className="role-row"><span className="role-badge admin">Admin</span> Full access + manage students</div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: var(--bg);
        }
        .card {
          width: 100%;
          max-width: 400px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px 28px;
        }
        .brand {
          text-align: center;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .logo-wrap {
          width: 80px; height: 80px;
          background: #000;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 12px;
          overflow: hidden;
          border: 2px solid #29b6e8;
        }
        .brand-name {
          font-family: var(--font-head);
          font-size: 28px;
          font-weight: 800;
          color: #29b6e8;
          letter-spacing: -0.01em;
          margin-bottom: 2px;
        }
        .brand-sub {
          font-family: var(--font-head);
          font-size: 14px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .brand-tagline {
          font-size: 12px;
          color: var(--text-muted);
        }
        .form-title {
          font-size: 20px;
          font-family: var(--font-head);
          margin-bottom: 20px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        input {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          padding: 12px 14px;
          font-size: 15px;
          font-family: var(--font-body);
          transition: border-color 0.15s;
        }
        input:focus { outline: none; border-color: #29b6e8; }
        input::placeholder { color: var(--text-muted); }
        .error-msg { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 14px; background: rgba(248,113,113,0.1); color: var(--danger); border: 1px solid rgba(248,113,113,0.2); }
        .success-msg { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 14px; background: rgba(110,231,183,0.1); color: var(--accent); border: 1px solid rgba(110,231,183,0.2); }
        .success-box { text-align: center; padding: 20px; background: rgba(110,231,183,0.1); border: 1px solid rgba(110,231,183,0.2); border-radius: var(--radius-sm); }
        .success-icon { font-size: 32px; color: var(--accent); margin-bottom: 8px; }
        .success-box p { font-size: 14px; color: var(--text-muted); margin-bottom: 12px; }
        .submit-btn {
          width: 100%;
          background: #29b6e8;
          color: #000;
          border: none;
          border-radius: var(--radius-sm);
          padding: 14px;
          font-size: 16px; font-weight: 700;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 14px;
        }
        .submit-btn:hover:not(:disabled) { background: #5ecbee; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .footer-links { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .link-btn { background: none; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; font-family: var(--font-body); text-decoration: underline; }
        .link-btn:hover { color: #29b6e8; }
        .roles-info { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
        .roles-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 10px; }
        .role-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
        .role-badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .role-badge.parent { background: rgba(110,231,183,0.15); color: var(--accent); }
        .role-badge.teacher { background: rgba(245,158,11,0.15); color: var(--accent2); }
        .role-badge.admin { background: rgba(248,113,113,0.15); color: var(--danger); }
      `}</style>
    </div>
  )
}
