import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { Card, Badge, EmptyState } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function History() {
  const { user, isTeacherOrAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [students, setStudents] = useState([])
  const [selected, setSelected] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('attendance')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading])

  useEffect(() => {
    if (!user) return
    loadStudents()
  }, [user, isTeacherOrAdmin])

  async function loadStudents() {
    let query = supabase.from('students').select('id, name').order('name')
    if (!isTeacherOrAdmin) {
      const { data: links } = await supabase
        .from('parent_students').select('student_id').eq('user_id', user.id)
      const ids = (links || []).map(l => l.student_id)
      if (ids.length === 0) { setStudents([]); return }
      query = query.in('id', ids)
    }
    const { data } = await query
    setStudents(data || [])
    if (data?.length) setSelected(data[0].id)
  }

  useEffect(() => {
    if (!selected) return
    fetchHistory(selected)
  }, [selected])

  async function fetchHistory(studentId) {
    setLoading(true)
    const [{ data: att }, { data: pay }] = await Promise.all([
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }),
      supabase.from('payments').select('*').eq('student_id', studentId).order('payment_date', { ascending: false })
    ])
    setAttendance(att || [])
    setPayments(pay || [])
    setLoading(false)
  }

  async function exportStudentCSV() {
    const student = students.find(s => s.id === selected)
    const rows = [
      ['Date', 'Class', 'Credits Used'],
      ...attendance.map(a => [a.date, a.class_name, a.credits_used])
    ]
    const payRows = [['Payment Date', 'Credits Added'], ...payments.map(p => [p.payment_date, p.credits_added])]
    const csv = [`# Attendance for ${student?.name}`, ...rows.map(r => r.join(',')), '', `# Payments for ${student?.name}`, ...payRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `history-${student?.name?.replace(/\s+/g, '-')}.csv`
    a.click()
  }

  const selectedStudent = students.find(s => s.id === selected)

  if (authLoading || !user) return null

  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-head">
          <h1 className="title">History</h1>
          {selected && isTeacherOrAdmin && (
            <button className="export-btn" onClick={exportStudentCSV}>⬇ CSV</button>
          )}
        </div>

        {students.length === 0 ? (
          <EmptyState icon="📋" title="No records yet" subtitle="History will appear here once check-ins are recorded" />
        ) : (
          <>
            {isTeacherOrAdmin && (
              <div className="student-picker">
                {students.map(s => (
                  <button key={s.id} className={`pick-btn ${selected === s.id ? 'active' : ''}`} onClick={() => setSelected(s.id)}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div className="tabs">
              <button className={`tab ${tab === 'attendance' ? 'active' : ''}`} onClick={() => setTab('attendance')}>
                Attendance <span className="count">{attendance.length}</span>
              </button>
              <button className={`tab ${tab === 'payments' ? 'active' : ''}`} onClick={() => setTab('payments')}>
                Payments <span className="count">{payments.length}</span>
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : tab === 'attendance' ? (
              attendance.length === 0 ? (
                <EmptyState icon="📅" title="No attendance records" subtitle={`${selectedStudent?.name} hasn't checked in yet`} />
              ) : (
                <div className="record-list">
                  {attendance.map(a => (
                    <div key={a.id} className="record-item">
                      <div className="record-dot attendance-dot" />
                      <div className="record-info">
                        <div className="record-title">{a.class_name || 'Class'}</div>
                        <div className="record-date">{formatDate(a.date)}</div>
                      </div>
                      <Badge variant="red">−{a.credits_used}</Badge>
                    </div>
                  ))}
                </div>
              )
            ) : (
              payments.length === 0 ? (
                <EmptyState icon="💳" title="No payment records" subtitle={`No credits purchased yet`} />
              ) : (
                <div className="record-list">
                  {payments.map(p => (
                    <div key={p.id} className="record-item">
                      <div className="record-dot payment-dot" />
                      <div className="record-info">
                        <div className="record-title">Credits purchased</div>
                        <div className="record-date">{formatDate(p.payment_date)}</div>
                      </div>
                      <Badge variant="green">+{p.credits_added}</Badge>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .page-wrap { padding-top: 20px; }
        .page-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
        .export-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 8px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; font-family: var(--font-body); }
        .export-btn:hover { color: var(--text); border-color: var(--accent); }
        .student-picker { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .pick-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); padding: 8px 14px; border-radius: 99px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: var(--font-body); transition: all 0.15s; }
        .pick-btn:hover { color: var(--text); }
        .pick-btn.active { background: var(--accent); color: #0a1a14; border-color: var(--accent); font-weight: 700; }
        .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
        .tab { background: none; border: none; padding: 12px 20px; font-size: 15px; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; font-family: var(--font-body); display: flex; align-items: center; gap: 8px; transition: all 0.15s; }
        .tab:hover { color: var(--text); }
        .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        .count { background: var(--surface2); padding: 2px 7px; border-radius: 99px; font-size: 12px; }
        .tab.active .count { background: rgba(110,231,183,0.15); color: var(--accent); }
        .loading { text-align: center; padding: 40px; color: var(--text-muted); }
        .record-list { display: flex; flex-direction: column; }
        .record-item { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--border); animation: slideIn 0.2s ease both; }
        .record-item:last-child { border-bottom: none; }
        .record-dot { width: 10px; height: 10px; flex-shrink: 0; border-radius: 50%; }
        .attendance-dot { background: var(--accent); }
        .payment-dot { background: var(--accent2); }
        .record-info { flex: 1; }
        .record-title { font-weight: 600; font-size: 15px; }
        .record-date { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
      `}</style>
    </>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
