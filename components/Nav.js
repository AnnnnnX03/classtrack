import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useAuth } from '../lib/AuthContext'

export default function Nav() {
  const router = useRouter()
  const { user, role, isTeacherOrAdmin, signOut } = useAuth()

  const tabs = isTeacherOrAdmin ? [
    { href: '/', icon: '⚡', label: 'Check In' },
    { href: '/students', icon: '👥', label: 'Students' },
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/history', icon: '📋', label: 'History' },
  ] : [
    { href: '/', icon: '🎫', label: 'My Credits' },
    { href: '/history', icon: '📋', label: 'History' },
  ]

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const roleLabel = role === 'admin' ? '👑 Admin' : role === 'teacher' ? '🎓 Teacher' : '👤 Parent'
  const roleColor = role === 'admin' ? 'var(--danger)' : role === 'teacher' ? 'var(--accent2)' : 'var(--accent)'

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-img-wrap">
              <Image src="/logo.png" alt="AiCAMP logo" width={36} height={36} style={{ objectFit: 'contain' }} />
            </div>
            <div className="logo-text-wrap">
              <span className="logo-name">AiCAMP</span>
              <span className="logo-sub">Class Track</span>
            </div>
          </div>
          {user && (
            <div className="user-area">
              <span className="role-pill" style={{ color: roleColor }}>{roleLabel}</span>
              <button className="signout-btn" onClick={handleSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </header>

      {user && (
        <nav className="bottom-nav">
          {tabs.map(t => {
            const active = router.pathname === t.href
            return (
              <Link key={t.href} href={t.href} className={active ? 'tab active' : 'tab'}>
                <span className="tab-icon">{t.icon}</span>
                <span className="tab-label">{t.label}</span>
              </Link>
            )
          })}
        </nav>
      )}

      <style jsx>{`
        .header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(15,17,23,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
        }
        .header-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-img-wrap {
          width: 40px; height: 40px;
          background: #000;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .logo-text-wrap { display: flex; flex-direction: column; line-height: 1.1; }
        .logo-name {
          font-family: var(--font-head);
          font-weight: 800;
          font-size: 16px;
          letter-spacing: -0.01em;
          color: #29b6e8;
        }
        .logo-sub {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .user-area { display: flex; align-items: center; gap: 10px; }
        .role-pill { font-size: 12px; font-weight: 700; letter-spacing: 0.02em; }
        .signout-btn {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 12px; font-weight: 500;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
        }
        .signout-btn:hover { color: var(--text); border-color: #29b6e8; }
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          display: flex;
          background: var(--surface);
          border-top: 1px solid var(--border);
          z-index: 50;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .tab {
          flex: 1;
          display: flex; flex-direction: column; align-items: center;
          gap: 3px;
          padding: 10px 4px 8px;
          color: var(--text-muted);
          transition: color 0.15s;
          text-transform: uppercase;
        }
        .tab:hover { color: var(--text); }
        .tab.active { color: #29b6e8; }
        .tab-icon { font-size: 20px; }
        .tab-label { font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
      `}</style>
    </>
  )
}
