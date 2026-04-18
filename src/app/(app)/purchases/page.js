'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fmtDate, today } from '@/lib/utils'

const EMPTY_FORM = {
  invoiceNo:'', gdNumber:'', txDate: today(), supplierName:'', notes:'',
  stockId:'', quantity:'',
}

export default function PurchasesPage() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [stocks,     setStocks]     = useState([])
  const [q,          setQ]          = useState('')
  const [editing,    setEditing]    = useState(null)   // null = new
  const [delTarget,  setDelTarget]  = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/purchases${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(setStocks)
  }, [])

  function f(k) {
    return { value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' }
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setForm({
      invoiceNo:    row.invoiceNo    || '',
      gdNumber:     row.gdNumber     || '',
      txDate:       row.txDate ? row.txDate.slice(0, 10) : today(),
      supplierName: row.supplierName || '',
      notes:        row.notes        || '',
      stockId:      String(row.stockId || ''),
      quantity:     String(row.quantity || ''),
    })
    setError('')
    setModal(true)
  }

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Purchase')
    const d = await r.json()
    setForm(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  function pickStock(id) {
    const s = stocks.find(s => s.stockId === Number(id))
    if (!s) return setForm(p => ({ ...p, stockId: id }))
    setForm(p => ({
      ...p, stockId: id,
      supplierName: p.supplierName || s.supplier || '',
    }))
  }

  async function handleSave() {
    setError('')
    if (!form.invoiceNo)            return setError('Generate or enter an Invoice Number')
    if (!form.stockId)              return setError('Select a product')
    if (Number(form.quantity) <= 0) return setError('Quantity must be > 0')

    setSaving(true)
    const url    = editing ? `/api/purchases/${editing.saleId}` : '/api/purchases'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Save failed')
      setSaving(false)
      return
    }
    setSaving(false)
    setModal(false)
    setForm(EMPTY_FORM)
    setEditing(null)
    load()
    // Refresh stock list
    fetch('/api/stock').then(r => r.json()).then(setStocks)
  }

  async function handleDelete() {
    await fetch(`/api/purchases/${delTarget.saleId}`, { method: 'DELETE' })
    setDelTarget(null)
    load()
    fetch('/api/stock').then(r => r.json()).then(setStocks)
  }

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle={`${rows.length} record(s)`}
        actions={<button onClick={openNew} className="btn-gold">+ Record Purchase</button>}
      />

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search invoice, GD No, supplier, product…" className="field-input flex-1" />
        <button onClick={load} className="btn-ghost">Search</button>
        <button onClick={() => setQ('')} className="btn-ghost text-slate-600">Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th><th>GD No.</th><th>Date</th><th>Our No.</th><th>Name</th>
                <th>Supplier</th><th className="text-right">Qty</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center text-slate-500 py-10">No purchases yet</td></tr>}
              {rows.map(r => (
                <tr key={r.saleId}>
                  <td className="font-mono text-xs text-sky-600">{r.invoiceNo || '—'}</td>
                  <td className="font-mono text-xs text-slate-400">{r.gdNumber || '—'}</td>
                  <td className="text-xs text-slate-600 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td className="font-mono text-xs text-slate-700">{r.stock?.ourNo || '—'}</td>
                  <td className="text-xs text-slate-700">{r.stock?.name || r.stock?.description || '—'}</td>
                  <td className="text-slate-600 text-xs">{r.supplierName || '—'}</td>
                  <td className="text-right font-mono text-xs text-slate-700">{r.quantity}</td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => openEdit(r)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                    <button onClick={() => setDelTarget(r)} className="text-danger/80 hover:text-danger text-xs transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit Purchase · ${editing.invoiceNo || ''}` : 'Record a Purchase'} wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          {/* Invoice row */}
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...f('invoiceNo')} placeholder="PO-20240101-001" className="field-input flex-1" />
              {!editing && <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>}
            </div>
          </div>
          <div>
            <label className="field-label">GD Number</label>
            <input {...f('gdNumber')} placeholder="e.g. GD-2024-00123" />
          </div>
          <div><label className="field-label">Purchase Date</label><input {...f('txDate')} type="date" /></div>
          <div><label className="field-label">Supplier</label><input {...f('supplierName')} placeholder="Supplier name" /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><input {...f('notes')} placeholder="Optional notes" /></div>

          <div className="col-span-2 border-t border-slate-200 pt-4">
            <label className="field-label">Product</label>
            <select value={form.stockId} onChange={e => pickStock(e.target.value)} className="field-input">
              <option value="">— Select product —</option>
              {stocks.map(s => (
                <option key={s.stockId} value={s.stockId}>
                  {s.ourNo ? `${s.ourNo} · ` : ''}{s.name || s.description || 'Unnamed'} [{s.stockType || 'No cat'}] — {s.quantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div><label className="field-label">Qty {editing ? 'Purchased' : 'Purchased'}</label><input {...f('quantity')} type="number" min="1" placeholder="0" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gold">
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Confirm & Save'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={handleDelete} danger
        title="Delete Purchase"
        message={`Delete purchase "${delTarget?.invoiceNo || ''}"? Stock will be reversed and the record deleted.`}
      />
    </div>
  )
}
