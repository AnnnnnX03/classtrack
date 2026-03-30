import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { Card, Badge, CreditBar, EmptyState } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Dashboard() {
  const { user, isTeacherOrAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState({ total: 0, low: 0, empty: 0, checkins: 0 })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user && !isTeacherOrAdmin) router.push('/')
  }, [user, authLoading, isTeacherOrAdmin])

  useEffect(() => {
    if (user && isTeacherOrAdmin) fetchData()
  }, [user, isTeacherOrAdmin])

  async function fetchData() {
    setLoading(true)
    const [{ data: studs }, { data: att }] = await Promise.all([
      supabase.from('students').select('*').order('remaining_credits'),
      supabase.from('attendance').select('*, students(name)').order('date', { ascending: false }).limit(10)
    ])
    const s = studs || []
    setStudents(s)
    setStats({
      total: s.length,
      low: s.filter(x => x.remaining_credits > 0 && x.remaining_credits < 3).length,
      empty: s.filter(x => x.remaining_credits <= 0).length,
      checkins: s.reduce((sum, x) => sum + (x.total_credits - x.remaining_credits), 0),
    })
    setRecentActivity(att || [])
    setLoading(false)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (authLoading || !user) return null

  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-head">
          <h1 className="title">Dashboard</h1>
          <p className="date">{today}</p>
        </div>

        {loading ? <div className="loading">Loading...</div> : (
          <>
            <div className="stats-grid">
              <StatCard label="Total Students" value={stats.total} icon="👥" color="accent" />
              <StatCard label="Total Check-ins" value={stats.checkins} icon="✓" color="green" />
              <StatCard label="Low Credits" value={stats.low} icon="⚠️" color="amber" />
              <StatCard label="Empty" value={stats.empty} icon="🚫" color="red" />
            </div>

            {(stats.low > 0 || stats.empty > 0) && (
              <div className="alert-section">
                <h2 className="section-title">⚠️ Needs Attention</h2>
                <div className="alert-list">
                  {students.filter(s => s.remaining_credits < 3).map(s => (
                    <Card key={s.id} className={`alert-card ${s.remaining_credits <= 0 ? 'empty' : 'low'}`}>
                      <div className="alert-row">
                        <div className="avatar">{s.name.charAt(0).toUpperCase()}</div>
                        <div className="alert-info">
                          <div className="alert-name">{s.name}</div>
                          <div className="alert-parent">{s.parent_name}</div>
                        </div>
                        <div className="alert-right">
                          <Badge variant={s.remaining_credits <= 0 ? 'red' : 'amber'}>
                            {s.remaining_credits <= 0 ? 'Empty' : `${s.remaining_credits} left`}
                          </Badge>
                          {s.email && (
                            <a href={`mailto:${s.email}?subject=Class Credits Running Low&body=Hi ${s.parent_name},%0D%0A%0D%0AThis is a reminder that ${s.name} has ${s.remaining_credits} class credit(s) remaining. Please arrange to purchase more credits.%0D%0A%0D%0AThank you!`}
                              className="email-btn">📧 Email</a>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <CreditBar remaining={s.remaining_credits} total={s.total_credits} />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="section">
              <h2 className="section-title">All Students</h2>
              {students.length === 0 ? (
                <EmptyState icon="👥" title="No students yet" subtitle="Add students from the Students tab" />
              ) : (
                <div className="all-list">
                  {students.map(s => (
                    <Card key={s.id} className="all-row">
                      <div className="all-top">
                        <div className="avatar-sm">{s.name.charAt(0).toUpperCase()}</div>
                        <div className="all-info">
                          <span className="all-name">{s.name}</span>
                          <span className="all-meta">{s.parent_name}</span>
                        </div>
                        <div className="all-creds">
                          <span className={`cred-num ${s.remaining_credits < 3 ? 'warn' : ''}`}>{s.remaining_credits}</span>
                          <span className="cred-tot">/{s.total_credits}</span>
                        </div>
                      </div>
                      <CreditBar remaining={s.remaining_credits} total={s.total_credits} />
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="section">
              <h2 className="section-title">Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <EmptyState icon="📋" title="No activity yet" subtitle="Check-ins will appear here" />
              ) : (
                <div className="activity-list">
                  {recentActivity.map(a => (
                    <div key={a.id} className="activity-item">
                      <div className="activity-dot" />
                      <div className="activity-info">
                        <span className="activity-name">{a.students?.name}</span>
                        <span className="activity-class">{a.class_name}</span>
                      </div>
                      <span className="activity-date">{a.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding-top: 20px; }
        .page-head { margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
        .date { color: var(--text-muted); font-size: 14px; margin-top: 2px; }
        .loading { text-align: center; padding: 40px; color: var(--text-muted); }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
        @media (min-width: 600px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
        .section { margin-top: 24px; }
        .alert-section { margin-top: 0; margin-bottom: 24px; }
        .section-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 12px; }
        .alert-list, .all-list { display: flex; flex-direction: column; gap: 10px; }
        .alert-card { transition: border-color 0.2s; }
        .alert-card.low { border-color: rgba(245,158,11,0.4); }
        .alert-card.empty { border-color: rgba(248,113,113,0.4); }
        .alert-row { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 40px; height: 40px; flex-shrink: 0; background: var(--surface2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-family: var(--font-head); font-weight: 800; font-size: 16px; color: var(--accent); }
        .avatar-sm { width: 32px; height: 32px; flex-shrink: 0; background: var(--surface2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-head); font-weight: 800; font-size: 13px; color: var(--accent); }
        .alert-info { flex: 1; min-width: 0; }
        .alert-name { font-weight: 700; font-size: 15px; display: block; }
        .alert-parent { font-size: 13px; color: var(--text-muted); }
        .alert-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .email-btn { font-size: 12px; font-weight: 600; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; color: var(--text-muted); transition: all 0.15s; }
        .email-btn:hover { color: var(--accent); border-color: var(--accent); }
        .all-row { padding: 14px 16px; }
        .all-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .all-info { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
        .all-name { font-weight: 600; font-size: 15px; }
        .all-meta { font-size: 13px; color: var(--text-muted); }
        .all-creds { flex-shrink: 0; }
        .cred-num { font-family: var(--font-head); font-size: 20px; font-weight: 800; }
        .cred-num.warn { color: var(--danger); }
        .cred-tot { font-size: 13px; color: var(--text-muted); }
        .activity-list { display: flex; flex-direction: column; }
        .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .activity-item:last-child { border-bottom: none; }
        .activity-dot { width: 8px; height: 8px; flex-shrink: 0; background: var(--accent); border-radius: 50%; }
        .activity-info { flex: 1; display: flex; gap: 8px; align-items: center; }
        .activity-name { font-weight: 600; font-size: 14px; }
        .activity-class { font-size: 12px; color: var(--text-muted); }
        .activity-date { font-size: 12px; color: var(--text-muted); }
      `}</style>
    </>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      <style jsx>{`
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
        .stat-icon { font-size: 22px; margin-bottom: 8px; }
        .stat-val { font-family: var(--font-head); font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-accent .stat-val { color: var(--text); }
        .stat-green .stat-val { color: var(--accent); }
        .stat-amber .stat-val { color: var(--accent2); }
        .stat-red .stat-val { color: var(--danger); }
      `}</style>
    </div>
  )
}
