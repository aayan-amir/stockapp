'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import { fmtDate } from '@/lib/utils'
import usePrintTrigger from '@/hooks/usePrintTrigger'

const EMPTY = { typeId:'', ourNo:'', oemNo:'', name:'', stockType:'', description:'', supplier:'' }
const SEARCH_FIELDS = [
  { value: 'ourNo',       label: 'Our No' },
  { value: 'oemNo',       label: 'OEM No' },
  { value: 'name',        label: 'Name' },
  { value: 'description', label: 'Description' },
  { value: 'stockType',   label: 'Category' },
  { value: 'supplier',    label: 'Supplier' },
]

export default function StockPage() {
  const [rows,     setRows]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [q,        setQ]        = useState('')
  const [field,    setField]    = useState('ourNo')
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)   // null = new
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [delTarget,setDelTarget]= useState(null)
  const [categories, setCategories] = useState([])
  const [printList, setPrintList] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}&field=${field}` : ''
    fetch(`/api/stock${params}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q, field])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])

  usePrintTrigger(printList, setPrintList, false)

  function openNew()     { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(row) { setEditing(row); setForm({ typeId: row.typeId||'', ourNo: row.ourNo||'', oemNo: row.oemNo||'', name: row.name||'', stockType: row.stockType||'', description: row.description||'', supplier: row.supplier||'' }); setModal(true) }

  async function handleSave() {
    if (!form.ourNo && !form.description) return alert('Enter at least Our No or Description')
    setSaving(true)
    const url    = editing ? `/api/stock/${editing.stockId}` : '/api/stock'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); load()
  }

  async function handleDelete() {
    await fetch(`/api/stock/${delTarget.stockId}`, { method: 'DELETE' })
    setDelTarget(null); load()
  }

  const inp = (k, extra = {}) => ({
    value: form[k] ?? '',
    onChange: e => setForm(f => ({ ...f, [k]: e.target.value })),
    className: 'field-input',
    ...extra,
  })

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${rows.length} item(s)`}
        actions={<div className="flex gap-2"><button onClick={() => setPrintList(true)} className="btn-ghost">🖨 Print List</button><button onClick={openNew} className="btn-gold">+ New Item</button></div>}
      />

      {/* Search bar */}
      <div className="flex gap-2 mb-5">
        <select value={field} onChange={e => setField(e.target.value)} className="field-input w-36">
          {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <input
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search…" className="field-input flex-1"
        />
        <button onClick={load}        className="btn-ghost">Search</button>
        <button onClick={() => { setQ(''); }} className="btn-ghost text-slate-600">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Our No</th><th>OEM No</th><th>Name</th><th>Category</th><th>Description</th>
                <th>Supplier</th><th className="text-right">In</th><th className="text-right">Out</th>
                <th className="text-right">Qty</th><th>Updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={11}><EmptyState icon="▦" title="No stock items" message="Add a new item to get started" action={<button onClick={openNew} className="btn-gold btn-sm">+ New Item</button>} /></td></tr>
              )}
              {rows.map(row => (
                <tr key={row.stockId}>
                  <td className="font-mono text-sky-600 text-xs">{row.ourNo || '—'}</td>
                  <td className="text-xs text-slate-600">{row.oemNo || '—'}</td>
                  <td className="max-w-[140px] truncate">{row.name || '—'}</td>
                  <td><span className="badge bg-slate-100 text-sky-700">{row.stockType || '—'}</span></td>
                  <td className="max-w-[180px] truncate">{row.description || '—'}</td>
                  <td className="text-slate-500 text-xs">{row.supplier || '—'}</td>
                  <td className="text-right font-mono text-xs text-slate-500">{row.stockIn}</td>
                  <td className="text-right font-mono text-xs text-slate-500">{row.stockOut}</td>
                  <td className="text-right">
                    <span className={row.quantity <= 0 ? 'badge-low' : row.quantity <= 5 ? 'badge-purchase' : 'badge-ok'}>
                      {row.quantity}
                    </span>
                  </td>
                  <td className="text-slate-600 text-xs whitespace-nowrap">{fmtDate(row.lastUpdated)}</td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => openEdit(row)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                    <button onClick={() => setDelTarget(row)} className="text-danger/80 hover:text-danger text-xs transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit · ${editing.ourNo || 'Item'}` : 'New Stock Item'}>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="field-label">Our No</label><input {...inp('ourNo')} placeholder="e.g. ENG-001" /></div>
          <div><label className="field-label">OEM No</label><input {...inp('oemNo')} placeholder="Original part no." /></div>
          <div className="col-span-2"><label className="field-label">Name</label><input {...inp('name')} placeholder="Product name" /></div>
          <div className="col-span-2"><label className="field-label">Description</label><input {...inp('description')} placeholder="Product description" /></div>
          <div>
            <label className="field-label">Category</label>
            <select
              value={form.typeId || ''}
              onChange={e => {
                const typeId = e.target.value ? Number(e.target.value) : ''
                const selected = categories.find(c => c.typeId === typeId)
                setForm(f => ({ ...f, typeId, stockType: selected ? selected.typeName : '' }))
              }}
              className="field-input"
            >
              <option value="">— Select —</option>
              {categories.map(c => <option key={c.typeId} value={c.typeId}>{c.typeName}</option>)}
            </select>
          </div>
          <div><label className="field-label">Supplier</label><input {...inp('supplier')} placeholder="Supplier name" /></div>
          {editing && (
            <div className="col-span-2 bg-slate-100 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
              {[['Stock In', editing.stockIn], ['Stock Out', editing.stockOut], ['Available', editing.quantity]].map(([l, v]) => (
                <div key={l}><div className="text-gold font-mono font-bold">{v}</div><div className="text-accent-dim text-xs mt-0.5">{l}</div></div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gold">{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Item'}</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} danger
        title="Delete Stock Item"
        message={`Delete "${delTarget?.ourNo || delTarget?.description}"? This cannot be undone.`}
      />

      {/* Stock list print */}
      {printList && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto' }}>
          <div className="print-area" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 12, color: '#1a1a1a', padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>STOCK REPORT</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Stock Management System</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>{rows.length} item(s)</div>
              </div>
            </div>
            <div style={{ borderTop: '2px solid #7c3aed', marginBottom: 16 }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f5ff' }}>
                  {['Our No.', 'OEM No.', 'Name / Description', 'Category', 'Supplier', 'In', 'Out', 'Qty'].map((h, i) => (
                    <th key={h} style={{ textAlign: i >= 5 ? 'right' : 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.stockId} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{r.ourNo || '—'}</td>
                    <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{r.oemNo || '—'}</td>
                    <td style={{ padding: '7px 10px', maxWidth: 200 }}>
                      {r.name && <div style={{ fontWeight: 500 }}>{r.name}</div>}
                      {r.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{r.description}</div>}
                      {!r.name && !r.description && <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{r.stockType || '—'}</td>
                    <td style={{ padding: '7px 10px', fontSize: 11, color: '#6b7280' }}>{r.supplier || '—'}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#059669' }}>{r.stockIn}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#dc2626' }}>{r.stockOut}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: r.quantity <= 0 ? '#dc2626' : r.quantity <= 5 ? '#d97706' : '#059669' }}>{r.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
              <span>Generated by Stock Management System</span>
              <span>{rows.length} item(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
