import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { Button, Card, Input, Modal, Badge, Toast, useToast, EmptyState } from '../components/ui'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const emptyForm = { name: '', parent_name: '', email: '', total_credits: '' }

export default function Students() {
  const { user, isTeacherOrAdmin, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterLow, setFilterLow] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [showEdit, setShowEdit] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [payForm, setPayForm] = useState({ credits: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const { toast, show } = useToast()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (!authLoading && user && !isTeacherOrAdmin) router.push('/')
  }, [user, authLoading, isTeacherOrAdmin])

  useEffect(() => {
    if (user && isTeacherOrAdmin) fetchStudents()
  }, [user, isTeacherOrAdmin])

  async function fetchStudents() {
    setLoading(true)
    const { data } = await supabase.from('students').select('*').order('name')
    setStudents(data || [])
    setLoading(false)
  }

  const filtered = students
    .filter(s => !filterLow || s.remaining_credits < 3)
    .filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.parent_name?.toLowerCase().includes(search.toLowerCase())
    )

  async function handleAddStudent() {
    if (!form.name.trim()) return show('Name is required', 'error')
    setSaving(true)
    const credits = parseInt(form.total_credits) || 0
    const { error } = await supabase.from('students').insert({
      name: form.name.trim(), parent_name: form.parent_name.trim(),
      email: form.email.trim(), total_credits: credits, remaining_credits: credits,
    })
    setSaving(false)
    if (error) return show(error.message, 'error')
    show(`${form.name} added!`)
    setForm(emptyForm); setShowAdd(false); fetchStudents()
  }

  async function handleEditStudent() {
    if (!form.name.trim()) return show('Name is required', 'error')
    setSaving(true)
    const { error } = await supabase.from('students')
      .update({ name: form.name.trim(), parent_name: form.parent_name.trim(), email: form.email.trim() })
      .eq('id', showEdit.id)
    setSaving(false)
    if (error) return show(error.message, 'error')
    show('Student updated!'); setShowEdit(null); fetchStudents()
  }

  async function handleAddPayment() {
    if (!payForm.credits || parseInt(payForm.credits) <= 0) return show('Enter valid credits', 'error')
    setSaving(true)
    const added = parseInt(payForm.credits)
    const student = students.find(s => s.id === showPayment.id)
    const { error: payErr } = await supabase.from('payments').insert({
      student_id: showPayment.id, credits_added: added, payment_date: payForm.date,
    })
    if (payErr) { setSaving(false); return show(payErr.message, 'error') }
    const { error: stuErr } = await supabase.from('students')
      .update({ total_credits: student.total_credits + added, remaining_credits: student.remaining_credits + added })
      .eq('id', showPayment.id)
    setSaving(false)
    if (stuErr) return show(stuErr.message, 'error')
    show(`+${added} credits added!`)
    setShowPayment(null); setPayForm({ credits: '', date: new Date().toISOString().split('T')[0] }); fetchStudents()
  }

  async function exportCSV() {
    const rows = [
      ['Name', 'Parent', 'Email', 'Total Credits', 'Remaining', 'Added'],
      ...students.map(s => [s.name, s.parent_name, s.email, s.total_credits, s.remaining_credits, s.created_at?.split('T')[0]])
    ]
    const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'students.csv'; a.click()
  }

  if (authLoading || !user) return null

  return (
    <>
      <Nav />
      <div className="page-wrap">
        <div className="page-head">
          <div>
            <h1 className="title">Students</h1>
            <p className="sub">{students.length} enrolled</p>
          </div>
          <div className="head-btns">
            <Button variant="secondary" size="sm" onClick={exportCSV}>⬇ CSV</Button>
            {isAdmin && <Button variant="primary" size="sm" onClick={() => { setForm(emptyForm); setShowAdd(true) }}>+ Add</Button>}
          </div>
        </div>

        <div className="controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className={`filter-btn ${filterLow ? 'active' : ''}`} onClick={() => setFilterLow(f => !f)}>
            ⚠️ Low Credits Only
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="👥" title="No students yet" subtitle="Add your first student to get started" />
        ) : (
          <div className="list">
            {filtered.map(s => {
              const low = s.remaining_credits < 3
              return (
                <Card key={s.id} className={`student-row ${low ? 'low' : ''}`}>
                  <div className="row-main">
                    <div className="avatar">{s.name.charAt(0).toUpperCase()}</div>
                    <div className="info">
                      <div className="name-row">
                        <span className="sname">{s.name}</span>
                        {low && <Badge variant={s.remaining_credits <= 0 ? 'red' : 'amber'}>
                          {s.remaining_credits <= 0 ? 'Empty' : 'Low'}
                        </Badge>}
                      </div>
                      <div className="meta">{s.parent_name}{s.email ? ` · ${s.email}` : ''}</div>
                    </div>
                    <div className="credits-badge">
                      <span className="cnum">{s.remaining_credits}</span>
                      <span className="cof">/{s.total_credits}</span>
                    </div>
                  </div>
                  <div className="row-actions">
                    {isAdmin && (
                      <Button variant="amber" size="sm" onClick={() => { setShowPayment(s); setPayForm({ credits: '', date: new Date().toISOString().split('T')[0] }) }}>
                        + Credits
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => { setShowEdit(s); setForm({ name: s.name, parent_name: s.parent_name || '', email: s.email || '', total_credits: s.total_credits }) }}>
                        Edit
                      </Button>
                    )}
                    {!isAdmin && (
                      <span className="view-only">View only — contact admin to make changes</span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Student">
        <div className="form-stack">
          <Input label="Student Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Jane Smith" required />
          <Input label="Parent Name" value={form.parent_name} onChange={v => setForm(f => ({ ...f, parent_name: v }))} placeholder="John Smith" />
          <Input label="Parent Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="parent@email.com" />
          <Input label="Starting Credits" type="number" value={form.total_credits} onChange={v => setForm(f => ({ ...f, total_credits: v }))} placeholder="10" />
          <Button variant="primary" size="lg" fullWidth onClick={handleAddStudent} loading={saving}>Add Student</Button>
        </div>
        <style jsx>{`.form-stack { display: flex; flex-direction: column; gap: 16px; }`}</style>
      </Modal>

      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Student">
        <div className="form-stack">
          <Input label="Student Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <Input label="Parent Name" value={form.parent_name} onChange={v => setForm(f => ({ ...f, parent_name: v }))} />
          <Input label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
          <Button variant="primary" size="lg" fullWidth onClick={handleEditStudent} loading={saving}>Save Changes</Button>
        </div>
        <style jsx>{`.form-stack { display: flex; flex-direction: column; gap: 16px; }`}</style>
      </Modal>

      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title={`Add Credits — ${showPayment?.name}`}>
        <div className="form-stack">
          <div className="current-credits">Current: <strong>{showPayment?.remaining_credits} credits remaining</strong></div>
          <Input label="Credits to Add" type="number" value={payForm.credits} onChange={v => setPayForm(f => ({ ...f, credits: v }))} placeholder="10" required />
          <Input label="Payment Date" type="date" value={payForm.date} onChange={v => setPayForm(f => ({ ...f, date: v }))} />
          <Button variant="amber" size="lg" fullWidth onClick={handleAddPayment} loading={saving}>
            Add {payForm.credits ? `+${payForm.credits}` : ''} Credits
          </Button>
        </div>
        <style jsx>{`
          .form-stack { display: flex; flex-direction: column; gap: 16px; }
          .current-credits { background: var(--surface2); padding: 12px; border-radius: 8px; font-size: 14px; color: var(--text-muted); }
          .current-credits strong { color: var(--accent); }
        `}</style>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}

      <style jsx>{`
        .page-wrap { padding-top: 20px; }
        .page-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
        .sub { color: var(--text-muted); font-size: 14px; margin-top: 2px; }
        .head-btns { display: flex; gap: 8px; }
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
        .filter-btn {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); color: var(--text-muted);
          padding: 10px 14px; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.15s; font-family: var(--font-body); text-align: left;
        }
        .filter-btn.active { border-color: var(--accent2); color: var(--accent2); background: rgba(245,158,11,0.08); }
        .loading { text-align: center; padding: 40px; color: var(--text-muted); }
        .list { display: flex; flex-direction: column; gap: 10px; }
        .student-row { transition: border-color 0.2s; }
        .student-row.low { border-color: rgba(245,158,11,0.3); }
        .row-main { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .avatar {
          width: 42px; height: 42px; flex-shrink: 0; background: var(--surface2);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-family: var(--font-head); font-weight: 800; font-size: 17px; color: var(--accent);
        }
        .info { flex: 1; min-width: 0; }
        .name-row { display: flex; align-items: center; gap: 8px; }
        .sname { font-weight: 700; font-size: 16px; }
        .meta { font-size: 13px; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .credits-badge { text-align: right; flex-shrink: 0; }
        .cnum { font-family: var(--font-head); font-size: 22px; font-weight: 800; }
        .cof { font-size: 13px; color: var(--text-muted); }
        .row-actions { display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; align-items: center; }
        .view-only { font-size: 12px; color: var(--text-muted); font-style: italic; }
      `}</style>
    </>
  )
}
