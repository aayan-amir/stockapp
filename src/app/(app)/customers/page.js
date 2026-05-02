'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'

const EMPTY = { customerName:'', address:'', phoneNumber:'', email:'', ntn:'', gstNumber:'', filerStatus:'', notes:'' }
const FILER = ['', 'Filer', 'Non-Filer', 'Exempt']

export default function CustomersPage() {
  const [rows,      setRows]     = useState([])
  const [loading,   setLoading]  = useState(true)
  const [q,         setQ]        = useState('')
  const [modal,     setModal]    = useState(false)
  const [editing,   setEditing]  = useState(null)
  const [form,      setForm]     = useState(EMPTY)
  const [saving,    setSaving]   = useState(false)
  const [delTarget, setDelTarget]= useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/customers${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])

  function openNew()     { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(row) { setEditing(row); setForm({ customerName: row.customerName, address: row.address||'', phoneNumber: row.phoneNumber||'', email: row.email||'', ntn: row.ntn||'', gstNumber: row.gstNumber||'', filerStatus: row.filerStatus||'', notes: row.notes||'' }); setModal(true) }

  async function handleSave() {
    if (!form.customerName.trim()) return alert('Customer Name is required')
    setSaving(true)
    const url    = editing ? `/api/customers/${editing.customerId}` : '/api/customers'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); load()
  }

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${rows.length} customer(s)`}
        actions={<div className="flex gap-2"><button onClick={() => { const p = q ? `?q=${encodeURIComponent(q)}` : ''; window.open(`/customers/print${p}`, '_blank') }} className="btn-ghost">🖨 Print List</button><button onClick={openNew} className="btn-gold">+ Add Customer</button></div>}
      />

      <div className="flex gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by name…" className="field-input flex-1" />
        <button onClick={load} className="btn-ghost">Search</button>
        <button onClick={() => setQ('')} className="btn-ghost text-slate-600">Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Phone</th><th>NTN</th><th>GST No.</th><th>Filer</th><th>Address</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-10">No customers yet</td></tr>}
              {rows.map(r => (
                <tr key={r.customerId}>
                  <td className="font-semibold">{r.customerName}</td>
                  <td className="text-slate-600 text-xs font-mono">{r.phoneNumber || '—'}</td>
                  <td className="text-slate-600 text-xs font-mono">{r.ntn || '—'}</td>
                  <td className="text-slate-600 text-xs font-mono">{r.gstNumber || '—'}</td>
                  <td>{r.filerStatus ? <span className="badge bg-slate-200 text-sky-700">{r.filerStatus}</span> : '—'}</td>
                  <td className="text-slate-600 text-xs max-w-[200px] truncate">{r.address || '—'}</td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => window.open(`/customers/${r.customerId}/print`, '_blank')} className="text-emerald-600 hover:text-emerald-500 text-xs mr-3 transition-colors">Print</button>
                    <button onClick={() => openEdit(r)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                    <button onClick={() => setDelTarget(r)} className="text-danger/80 hover:text-danger text-xs transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit · ${editing.customerName}` : 'New Customer'}>
        <div className="space-y-4">
          <div><label className="field-label">Customer Name *</label><input {...f('customerName')} placeholder="Full name" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Phone</label><input {...f('phoneNumber')} placeholder="+92 300 0000000" /></div>
            <div><label className="field-label">Email</label><input {...f('email')} type="email" placeholder="email@example.com" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">NTN Number</label><input {...f('ntn')} placeholder="e.g. 1234567-8" /></div>
            <div><label className="field-label">GST / STRN Number</label><input {...f('gstNumber')} placeholder="e.g. 08-01-9999-001-99" /></div>
          </div>
          <div>
            <label className="field-label">Filer Status</label>
            <select {...f('filerStatus')} className="field-input">
              {FILER.map(s => <option key={s} value={s}>{s || '— Select —'}</option>)}
            </select>
          </div>
          <div><label className="field-label">Address</label><textarea {...f('address')} rows={2} placeholder="Address…" className="field-input resize-none" /></div>
          <div><label className="field-label">Notes</label><textarea {...f('notes')} rows={2} placeholder="Internal notes…" className="field-input resize-none" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gold">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Customer'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget} onClose={() => setDelTarget(null)}
        onConfirm={async () => { await fetch(`/api/customers/${delTarget.customerId}`, { method: 'DELETE' }); setDelTarget(null); load() }}
        danger title="Delete Customer" message={`Delete "${delTarget?.customerName}"? Past transactions will remain.`}
      />
    </div>
  )
}
