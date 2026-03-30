import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { Button, Card, Badge, Toast, useToast, CreditBar, Modal } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function CheckIn() {
  const { user, role, isTeacherOrAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [students, setStudents] = useState([])
  const [checkedInToday, setCheckedInToday] = useState({}) // studentId -> attendanceId
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(null)
  const [undoing, setUndoing] = useState(null)
  const [className, setClassName] = useState('')
  const [confirmUndo, setConfirmUndo] = useState(null) // student to undo
  const { toast, show } = useToast()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    // Parents see only their linked student(s)
    let studentsQuery = supabase.from('students').select('*').order('name')
    if (!isTeacherOrAdmin) {
      // fetch linked student IDs for this parent
      const { data: links } = await supabase
        .from('parent_students')
        .select('student_id')
        .eq('user_id', user.id)
      const ids = (links || []).map(l => l.student_id)
      if (ids.length === 0) { setStudents([]); setLoading(false); return }
      studentsQuery = studentsQuery.in('id', ids)
    }

    const [{ data: studs }, { data: todayAtt }] = await Promise.all([
      studentsQuery,
      supabase.from('attendance').select('id, student_id').eq('date', today),
    ])

    if (studs) setStudents(studs)
    // Map studentId -> attendanceId so we can undo
    const map = {}
    ;(todayAtt || []).forEach(a => { map[a.student_id] = a.id })
    setCheckedInToday(map)
    setLoading(false)
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.parent_name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCheckIn(student) {
    if (student.remaining_credits <= 0) { show('No credits remaining!', 'error'); return }
    if (checkedInToday[student.id]) { show(`${student.name} is already checked in today!`, 'error'); return }
    setCheckingIn(student.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: att, error: attErr } = await supabase
        .from('attendance')
        .insert({ student_id: student.id, date: today, class_name: className || 'Class', credits_used: 1 })
        .select('id')
        .single()
      if (attErr) throw attErr

      const { error: stuErr } = await supabase
        .from('students')
        .update({ remaining_credits: student.remaining_credits - 1 })
        .eq('id', student.id)
      if (stuErr) throw stuErr

      show(`✓ ${student.name} checked in!`)
      fetchData()
    } catch (e) { show(e.message, 'error') }
    setCheckingIn(null)
  }

  async function handleUndo(student) {
    const attendanceId = checkedInToday[student.id]
    if (!attendanceId) return
    setUndoing(student.id)
    try {
      const { error: delErr } = await supabase
        .from('attendance')
        .delete()
        .eq('id', attendanceId)
      if (delErr) throw delErr

      const { error: stuErr } = await supabase
        .from('students')
        .update({ remaining_credits: student.remaining_credits + 1 })
        .eq('id', student.id)
      if (stuErr) throw stuErr

      show(`↩ ${student.name}'s check-in removed`)
      setConfirmUndo(null)
      fetchData()
    } catch (e) { show(e.message, 'error') }
    setUndoing(null)
  }

  const lowCount = students.filter(s => s.remaining_credits < 3 && !checkedInToday[s.id]).length

  if (authLoading || !user) return null

  // ── Parent view ──────────────────────────────────────────────
  if (!isTeacherOrAdmin) {
    return (
      <>
        <Nav />
        <div className="page-wrap">
          <div className="page-head">
            <div>
              <h1 className="title">My Credits</h1>
              <p className="sub">Your child's remaining class credits</p>
            </div>
          </div>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : students.length === 0 ? (
            <div className="no-link">
              <div className="no-link-icon">🔗</div>
              <div className="no-link-title">Not linked to a student yet</div>
              <div className="no-link-sub">Please contact the administrator to link your account to your child.</div>
            </div>
          ) : (
            <div className="student-grid">
              {students.map(s => {
                const low = s.remaining_credits < 3
                const empty = s.remaining_credits <= 0
                const doneToday = !!checkedInToday[s.id]
                return (
                  <Card key={s.id} className={`student-card ${low ? 'low' : ''} ${doneToday ? 'done-today' : ''}`}>
                    <div className="student-top">
                      <div className={`avatar ${doneToday ? 'avatar-done' : ''}`}>
                        {doneToday ? '✓' : s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-info">
                        <div className="student-name">{s.name}</div>
                        <div className="parent-name">{doneToday ? '✓ Attended today' : 'Not yet checked in today'}</div>
                      </div>
                      {doneToday && <Badge variant="green">Today ✓</Badge>}
                      {!doneToday && low && !empty && <Badge variant="amber">Low</Badge>}
                      {!doneToday && empty && <Badge variant="red">Empty</Badge>}
                    </div>
                    <div className="credits-row">
                      <div className="credits-num">
                        <span className="cred-big">{s.remaining_credits}</span>
                        <span className="cred-of"> / {s.total_credits}</span>
                      </div>
                      <span className="cred-label">credits left</span>
                    </div>
                    <CreditBar remaining={s.remaining_credits} total={s.total_credits} />
                    {low && !empty && (
                      <div className="low-warning">⚠️ Running low — please contact your teacher to top up</div>
                    )}
                    {empty && (
                      <div className="empty-warning">🚫 No credits left — please contact your teacher</div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
        <style jsx>{`
          .page-wrap { padding-top: 20px; }
          .page-head { margin-bottom: 20px; }
          .title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
          .sub { color: var(--text-muted); font-size: 14px; margin-top: 2px; }
          .loading { text-align: center; padding: 40px; color: var(--text-muted); }
          .no-link { text-align: center; padding: 60px 20px; }
          .no-link-icon { font-size: 40px; margin-bottom: 12px; }
          .no-link-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
          .no-link-sub { font-size: 14px; color: var(--text-muted); }
          .student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
          .student-card { transition: border-color 0.2s; }
          .student-card.low { border-color: rgba(245,158,11,0.4); }
          .student-card.done-today { border-color: rgba(110,231,183,0.35); }
          .student-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
          .avatar {
            width: 44px; height: 44px; background: var(--surface2); border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-family: var(--font-head); font-weight: 800; font-size: 18px; color: var(--accent); flex-shrink: 0;
          }
          .avatar-done { background: rgba(110,231,183,0.15); }
          .student-info { flex: 1; min-width: 0; }
          .student-name { font-weight: 700; font-size: 16px; }
          .parent-name { font-size: 13px; color: var(--text-muted); }
          .credits-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; margin-top: 14px; }
          .credits-num { display: flex; align-items: baseline; gap: 2px; }
          .cred-big { font-family: var(--font-head); font-size: 32px; font-weight: 800; }
          .cred-of { color: var(--text-muted); font-size: 14px; }
          .cred-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
          .low-warning { margin-top: 12px; padding: 10px 12px; background: rgba(245,158,11,0.1); border-radius: 8px; font-size: 13px; color: var(--accent2); }
          .empty-warning { margin-top: 12px; padding: 10px 12px; background: rgba(248,113,113,0.1); border-radius: 8px; font-size: 13px; color: var(--danger); }
        `}</style>
      </>
    )
  }

  // ── Teacher / Admin view ─────────────────────────────────────
  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-head">
          <div>
            <h1 className="title">Check In</h1>
            <p className="sub">Tap a student to mark attendance</p>
          </div>
          {lowCount > 0 && (
            <div className="alert-badge">⚠️ {lowCount} low credit{lowCount > 1 ? 's' : ''}</div>
          )}
        </div>

        <div className="controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="class-input" placeholder="Class name (optional)" value={className} onChange={e => setClassName(e.target.value)} />
        </div>

        {loading ? (
          <div className="loading">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-msg">No students found</div>
        ) : (
          <div className="student-grid">
            {filtered.map(s => {
              const low = s.remaining_credits < 3
              const empty = s.remaining_credits <= 0
              const doneToday = !!checkedInToday[s.id]
              return (
                <Card key={s.id} className={`student-card ${low && !doneToday ? 'low' : ''} ${empty ? 'empty-cred' : ''} ${doneToday ? 'done-today' : ''}`}>
                  <div className="student-top">
                    <div className={`avatar ${doneToday ? 'avatar-done' : ''}`}>
                      {doneToday ? '✓' : s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <div className="student-name">{s.name}</div>
                      <div className="parent-name">{s.parent_name}</div>
                    </div>
                    {doneToday && <Badge variant="green">Today ✓</Badge>}
                    {!doneToday && low && !empty && <Badge variant="amber">Low</Badge>}
                    {!doneToday && empty && <Badge variant="red">Empty</Badge>}
                  </div>

                  <div className="credits-row">
                    <div className="credits-num">
                      <span className="cred-big">{s.remaining_credits}</span>
                      <span className="cred-of"> / {s.total_credits}</span>
                    </div>
                    <span className="cred-label">credits left</span>
                  </div>

                  <CreditBar remaining={s.remaining_credits} total={s.total_credits} />

                  {doneToday ? (
                    <div className="btn-row">
                      <div className="checked-in-label">✓ Checked In Today</div>
                      <button className="undo-btn" onClick={() => setConfirmUndo(s)} disabled={undoing === s.id}>
                        ↩ Undo
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant={empty ? 'secondary' : 'primary'}
                      size="lg"
                      fullWidth
                      onClick={() => handleCheckIn(s)}
                      disabled={empty || checkingIn === s.id}
                      loading={checkingIn === s.id}
                      style={{ marginTop: 14 }}
                    >
                      {empty ? 'No Credits' : '✓ Check In'}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Undo Confirmation Modal */}
      <Modal open={!!confirmUndo} onClose={() => setConfirmUndo(null)} title="Undo Check-In?">
        <div className="undo-modal">
          <div className="undo-icon">↩</div>
          <p className="undo-msg">
            Remove today's check-in for <strong>{confirmUndo?.name}</strong>?
            This will restore 1 credit back to their account.
          </p>
          <div className="undo-btns">
            <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmUndo(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => handleUndo(confirmUndo)}
              loading={undoing === confirmUndo?.id}
            >
              Yes, Undo Check-In
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <style jsx>{`
        .page-wrap { padding-top: 20px; }
        .page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
        .sub { color: var(--text-muted); font-size: 14px; margin-top: 2px; }
        .alert-badge {
          background: rgba(245,158,11,0.15); color: var(--accent2);
          padding: 6px 12px; border-radius: 99px;
          font-size: 13px; font-weight: 600; white-space: nowrap;
        }
        .controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
        .search-wrap { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 12px; font-size: 16px; }
        .search {
          width: 100%; background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text);
          padding: 12px 14px 12px 38px; font-size: 15px; font-family: var(--font-body);
        }
        .search:focus { outline: none; border-color: var(--accent); }
        .search::placeholder { color: var(--text-muted); }
        .class-input {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text);
          padding: 12px 14px; font-size: 15px; font-family: var(--font-body); width: 100%;
        }
        .class-input:focus { outline: none; border-color: var(--accent); }
        .class-input::placeholder { color: var(--text-muted); }
        .loading, .empty-msg { text-align: center; padding: 40px; color: var(--text-muted); }
        .student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
        .student-card { transition: border-color 0.2s; }
        .student-card.low { border-color: rgba(245,158,11,0.4); }
        .student-card.empty-cred { border-color: rgba(248,113,113,0.4); opacity: 0.7; }
        .student-card.done-today { border-color: rgba(110,231,183,0.35); opacity: 0.85; }
        .student-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .avatar {
          width: 44px; height: 44px; background: var(--surface2); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head); font-weight: 800; font-size: 18px; color: var(--accent); flex-shrink: 0;
        }
        .avatar-done { background: rgba(110,231,183,0.15); color: var(--accent); }
        .student-info { flex: 1; min-width: 0; }
        .student-name { font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .parent-name { font-size: 13px; color: var(--text-muted); }
        .credits-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
        .credits-num { display: flex; align-items: baseline; gap: 2px; }
        .cred-big { font-family: var(--font-head); font-size: 28px; font-weight: 800; }
        .cred-of { color: var(--text-muted); font-size: 14px; }
        .cred-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .btn-row {
          display: flex; align-items: center; gap: 10px;
          margin-top: 14px;
        }
        .checked-in-label {
          flex: 1;
          background: rgba(110,231,183,0.1);
          border: 1px solid rgba(110,231,183,0.2);
          color: var(--accent);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px; font-weight: 600;
          text-align: center;
        }
        .undo-btn {
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          font-family: var(--font-body);
          transition: all 0.15s;
          white-space: nowrap;
        }
        .undo-btn:hover:not(:disabled) { color: var(--danger); border-color: var(--danger); background: rgba(248,113,113,0.08); }
        .undo-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .undo-modal { text-align: center; }
        .undo-icon { font-size: 36px; margin-bottom: 12px; }
        .undo-msg { font-size: 15px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }
        .undo-msg strong { color: var(--text); }
        .undo-btns { display: flex; flex-direction: column; gap: 10px; }
      `}</style>
    </>
  )
}
