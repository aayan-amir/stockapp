'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import EmptyState from '@/components/EmptyState'
import { fmt, fmtDate } from '@/lib/utils'

const EMPTY = { typeId:'', ourNo:'', oemNo:'', name:'', stockType:'', description:'', supplier:'', foreignCurrency:'PKR', foreignCurrencyPrice:'' }
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
  const [currencies, setCurrencies] = useState([])
  const [categories, setCategories] = useState([])

  const load = useCallback(() => {
    setLoading(true)
    const params = q ? `?q=${encodeURIComponent(q)}&field=${field}` : ''
    fetch(`/api/stock${params}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q, field])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/currencies').then(r => r.json()).then(setCurrencies)
    fetch('/api/categories').then(r => r.json()).then(setCategories)
  }, [])

  function openNew()     { setEditing(null); setForm(EMPTY); setModal(true) }
  function openEdit(row) { setEditing(row); setForm({ typeId: row.typeId||'', ourNo: row.ourNo||'', oemNo: row.oemNo||'', name: row.name||'', stockType: row.stockType||'', description: row.description||'', supplier: row.supplier||'', foreignCurrency: row.foreignCurrency||'PKR', foreignCurrencyPrice: row.foreignCurrencyPrice||'' }); setModal(true) }

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
        actions={<button onClick={openNew} className="btn-gold">+ New Item</button>}
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
        <button onClick={() => { setQ(''); }} className="btn-ghost text-white/30">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Our No</th><th>OEM No</th><th>Name</th><th>Category</th><th>Description</th>
                <th>Supplier</th><th className="text-right">In</th><th className="text-right">Out</th>
                <th className="text-right">Qty</th><th>Price FCY</th><th>Updated</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={12} className="text-center text-white/20 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={12}><EmptyState icon="▦" title="No stock items" message="Add a new item to get started" action={<button onClick={openNew} className="btn-gold btn-sm">+ New Item</button>} /></td></tr>
              )}
              {rows.map(row => (
                <tr key={row.stockId}>
                  <td className="font-mono text-accent/80 text-xs">{row.ourNo || '—'}</td>
                  <td className="text-xs text-white/50">{row.oemNo || '—'}</td>
                  <td className="max-w-[140px] truncate">{row.name || '—'}</td>
                  <td><span className="badge bg-navy-300 text-accent/70">{row.stockType || '—'}</span></td>
                  <td className="max-w-[180px] truncate">{row.description || '—'}</td>
                  <td className="text-white/50 text-xs">{row.supplier || '—'}</td>
                  <td className="text-right font-mono text-xs text-white/50">{row.stockIn}</td>
                  <td className="text-right font-mono text-xs text-white/50">{row.stockOut}</td>
                  <td className="text-right">
                    <span className={row.quantity <= 0 ? 'badge-low' : row.quantity <= 5 ? 'badge-purchase' : 'badge-ok'}>
                      {row.quantity}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-white/60">
                    {row.foreignCurrencyPrice ? `${row.foreignCurrency} ${fmt(row.foreignCurrencyPrice)}` : '—'}
                  </td>
                  <td className="text-white/30 text-xs whitespace-nowrap">{fmtDate(row.lastUpdated)}</td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => openEdit(row)} className="text-accent/40 hover:text-accent text-xs mr-3 transition-colors">Edit</button>
                    <button onClick={() => setDelTarget(row)} className="text-danger/40 hover:text-danger text-xs transition-colors">Delete</button>
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
          <div>
            <label className="field-label">Currency</label>
            <select {...inp('foreignCurrency')} className="field-input">
              {currencies.map(c => <option key={c.rateId} value={c.currencyCode}>{c.currencyCode} – {c.currencyName}</option>)}
            </select>
          </div>
          <div><label className="field-label">Unit Price (FCY)</label><input {...inp('foreignCurrencyPrice')} type="number" step="0.01" placeholder="0.00" /></div>
          {editing && (
            <div className="col-span-2 bg-navy-200 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
              {[['Stock In', editing.stockIn], ['Stock Out', editing.stockOut], ['Available', editing.quantity]].map(([l, v]) => (
                <div key={l}><div className="text-gold font-mono font-bold">{v}</div><div className="text-accent/50 text-xs mt-0.5">{l}</div></div>
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
    </div>
  )
}
