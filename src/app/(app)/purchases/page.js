'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fmtDate, today } from '@/lib/utils'

const EMPTY_HEADER = { invoiceNo: '', gdNumber: '', txDate: today(), supplierName: '', notes: '' }
const EMPTY_ITEM   = { stockId: '', quantity: '' }

export default function PurchasesPage() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [header,    setHeader]    = useState(EMPTY_HEADER)
  const [lineItems, setLineItems] = useState([{ ...EMPTY_ITEM }])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [stocks,    setStocks]    = useState([])
  const [q,         setQ]         = useState('')
  const [editing,   setEditing]   = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/purchases${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch('/api/stock').then(r => r.json()).then(setStocks) }, [])

  const fh = k => ({ value: header[k] ?? '', onChange: e => setHeader(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  function updateItem(idx, field, val) {
    setLineItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
    // Auto-fill supplier from first picked stock item
    if (field === 'stockId' && idx === 0) {
      const s = stocks.find(s => s.stockId === Number(val))
      if (s?.supplier && !header.supplierName) setHeader(p => ({ ...p, supplierName: s.supplier }))
    }
  }
  function addItem()        { setLineItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx)  { setLineItems(prev => prev.filter((_, i) => i !== idx)) }

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Purchase')
    const d = await r.json()
    setHeader(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  function openNew() {
    setEditing(null)
    setHeader(EMPTY_HEADER)
    setLineItems([{ ...EMPTY_ITEM }])
    setError('')
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setHeader({
      invoiceNo:    row.invoiceNo    || '',
      gdNumber:     row.gdNumber     || '',
      txDate:       row.txDate ? row.txDate.slice(0, 10) : today(),
      supplierName: row.supplierName || '',
      notes:        row.notes        || '',
    })
    const its = row.items && row.items.length > 0
      ? row.items.map(it => ({ stockId: String(it.stockId || ''), quantity: String(it.quantity || '') }))
      : (row.stockId ? [{ stockId: String(row.stockId), quantity: String(row.quantity || '') }] : [{ ...EMPTY_ITEM }])
    setLineItems(its)
    setError('')
    setModal(true)
  }

  async function handleSave() {
    setError('')
    if (!header.invoiceNo) return setError('Generate or enter an Invoice Number')
    if (lineItems.length === 0) return setError('Add at least one item')
    for (const [i, it] of lineItems.entries()) {
      if (!it.stockId)              return setError(`Row ${i + 1}: select a product`)
      if (Number(it.quantity) <= 0) return setError(`Row ${i + 1}: quantity must be > 0`)
    }

    setSaving(true)
    const body = { ...header, items: lineItems.map(it => ({ stockId: Number(it.stockId), quantity: Number(it.quantity) })) }
    const url    = editing ? `/api/purchases/${editing.saleId}` : '/api/purchases'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Save failed')
      setSaving(false)
      return
    }
    setSaving(false)
    setModal(false)
    setEditing(null)
    load()
    fetch('/api/stock').then(r => r.json()).then(setStocks)
  }

  async function handleDelete() {
    await fetch(`/api/purchases/${delTarget.saleId}`, { method: 'DELETE' })
    setDelTarget(null)
    load()
    fetch('/api/stock').then(r => r.json()).then(setStocks)
  }

  function itemSummary(row) {
    const its = row.items && row.items.length > 0 ? row.items : []
    if (its.length === 0) return { names: row.stock?.name || row.stock?.description || '—', totalQty: row.quantity }
    const names = its.map(it => it.stock?.name || it.stock?.description || it.stock?.ourNo || '?').join(', ')
    const totalQty = its.reduce((s, it) => s + (it.quantity || 0), 0)
    return { names, totalQty }
  }

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle={`${rows.length} record(s)`}
        actions={<div className="flex gap-2"><button onClick={() => { const p = q ? `?q=${encodeURIComponent(q)}` : ''; window.open(`/purchases/print${p}`, '_blank') }} className="btn-ghost">🖨 Print List</button><button onClick={openNew} className="btn-gold">+ Record Purchase</button></div>}
      />

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
                <th>Invoice</th><th>GD No.</th><th>Date</th><th>Items</th>
                <th>Supplier</th><th className="text-right">Total Qty</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-10">No purchases yet</td></tr>}
              {rows.map(r => {
                const { names, totalQty } = itemSummary(r)
                return (
                  <tr key={r.saleId}>
                    <td className="font-mono text-xs text-sky-600">{r.invoiceNo || '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{r.gdNumber || '—'}</td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                    <td className="text-xs text-slate-700 max-w-[220px] truncate">{names}</td>
                    <td className="text-slate-600 text-xs">{r.supplierName || '—'}</td>
                    <td className="text-right font-mono text-xs text-slate-700">{totalQty}</td>
                    <td className="whitespace-nowrap">
                      <button onClick={() => window.open(`/sales/${r.saleId}/print`, '_blank')} className="text-emerald-600 hover:text-emerald-500 text-xs mr-3 transition-colors">Print</button>
                      <button onClick={() => openEdit(r)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDelTarget(r)} className="text-danger/80 hover:text-danger text-xs transition-colors">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit Purchase · ${editing.invoiceNo || ''}` : 'Record a Purchase'} wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}

        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...fh('invoiceNo')} placeholder="PO-20240101-001" className="field-input flex-1" />
              {!editing && <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>}
            </div>
          </div>
          <div>
            <label className="field-label">GD Number</label>
            <input {...fh('gdNumber')} placeholder="e.g. GD-2024-00123" />
          </div>
          <div><label className="field-label">Purchase Date</label><input {...fh('txDate')} type="date" /></div>
          <div><label className="field-label">Supplier</label><input {...fh('supplierName')} placeholder="Supplier name" /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><input {...fh('notes')} placeholder="Optional notes" /></div>
        </div>

        {/* Line items */}
        <div className="border-t border-zinc-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="field-label mb-0">Line Items</span>
            <button onClick={addItem} className="btn-ghost btn-sm">+ Add Item</button>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1">
                  <select
                    value={item.stockId}
                    onChange={e => updateItem(idx, 'stockId', e.target.value)}
                    className="field-input"
                  >
                    <option value="">— Select product —</option>
                    {stocks.map(s => (
                      <option key={s.stockId} value={s.stockId}>
                        {s.ourNo ? `${s.ourNo} · ` : ''}{s.name || s.description || 'Unnamed'} [{s.stockType || 'No cat'}] — {s.quantity} in stock
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <input
                    type="number" min="1" placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    className="field-input"
                  />
                </div>
                {lineItems.length > 1 && (
                  <button onClick={() => removeItem(idx)} className="text-danger/70 hover:text-danger text-lg leading-none pt-2 px-1">×</button>
                )}
              </div>
            ))}
          </div>
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
