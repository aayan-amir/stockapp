'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fmtDate, today } from '@/lib/utils'

const EMPTY = {
  invoiceNo:'', txDate: today(), customerId:'', notes:'',
  stockId:'', quantity:'',
}

export default function SalesPage() {
  const [rows,       setRows]      = useState([])
  const [loading,    setLoading]   = useState(true)
  const [modal,      setModal]     = useState(false)
  const [form,       setForm]      = useState(EMPTY)
  const [saving,     setSaving]    = useState(false)
  const [error,      setError]     = useState('')
  const [stocks,     setStocks]    = useState([])
  const [customers,  setCustomers] = useState([])
  const [selStock,   setSelStock]  = useState(null)   // full stock record
  const [q,          setQ]         = useState('')
  const [delTarget,  setDelTarget] = useState(null)
  const [editing,    setEditing]   = useState(null)   // null = new

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/sales${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d))
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  function pickStock(id) {
    const s = stocks.find(s => s.stockId === Number(id))
    setSelStock(s || null)
    setForm(p => ({ ...p, stockId: id }))
  }

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setSelStock(null)
    setError('')
    setModal(true)
    // Reset stock list to in-stock only for new sales
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  function openEdit(row) {
    setEditing(row)
    const s = stocks.find(s => s.stockId === row.stockId) || row.stock || null
    setSelStock(s)
    setForm({
      invoiceNo:  row.invoiceNo  || '',
      txDate:     row.txDate ? row.txDate.slice(0, 10) : today(),
      customerId: row.customerId ? String(row.customerId) : '',
      notes:      row.notes      || '',
      stockId:    String(row.stockId || ''),
      quantity:   String(row.quantity || ''),
    })
    setError('')
    // For editing, show all stocks so the current product is selectable
    fetch('/api/stock').then(r => r.json()).then(setStocks)
    setModal(true)
  }

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Sale')
    const d = await r.json()
    setForm(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  async function handleSave() {
    setError('')
    if (!form.invoiceNo)            return setError('Generate or enter an Invoice Number')
    if (!form.stockId)              return setError('Select a product')
    if (Number(form.quantity) <= 0) return setError('Enter quantity to sell')

    // For new sales, enforce stock availability client-side
    if (!editing) {
      if (!selStock)                                          return setError('Product not found')
      if (Number(form.quantity) > selStock.quantity)         return setError(`Only ${selStock.quantity} unit(s) available`)
    }

    setSaving(true)
    const url    = editing ? `/api/sales/${editing.saleId}` : '/api/sales'
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
    setForm(EMPTY)
    setSelStock(null)
    setEditing(null)
    load()
    // Refresh stock list
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  async function handleDelete() {
    await fetch(`/api/sales/${delTarget.saleId}`, { method: 'DELETE' })
    setDelTarget(null)
    load()
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle={`${rows.length} record(s)`}
        actions={<button onClick={openNew} className="btn-gold">+ Record Sale</button>}
      />

      <div className="flex gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search invoice, customer, product…" className="field-input flex-1" />
        <button onClick={load} className="btn-ghost">Search</button>
        <button onClick={() => setQ('')} className="btn-ghost text-slate-600">Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th><th>Date</th><th>Our No.</th><th>Name</th><th>Customer</th>
                <th className="text-right">Qty</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={7} className="text-center text-slate-500 py-10">No sales yet</td></tr>}
              {rows.map(r => (
                <tr key={r.saleId}>
                  <td className="font-mono text-xs text-sky-600">{r.invoiceNo || '—'}</td>
                  <td className="text-xs text-slate-600 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td className="font-mono text-xs text-slate-700">{r.stock?.ourNo || '—'}</td>
                  <td className="text-xs text-slate-700">{r.stock?.name || r.stock?.description || '—'}</td>
                  <td className="text-slate-600 text-xs">{r.customer?.customerName || 'Walk-in'}</td>
                  <td className="text-right font-mono text-xs text-slate-700">{r.quantity}</td>
                  <td className="whitespace-nowrap">
                    <button onClick={() => openEdit(r)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                    <button onClick={() => setDelTarget(r)} className="text-danger/80 hover:text-danger text-xs transition-colors">Void</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit Sale · ${editing.invoiceNo || ''}` : 'Record a Sale'} wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...f('invoiceNo')} placeholder="SALE-20240101-001" className="field-input flex-1" />
              {!editing && <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>}
            </div>
          </div>
          <div><label className="field-label">Sale Date</label><input {...f('txDate')} type="date" /></div>
          <div className="col-span-2">
            <label className="field-label">Customer <span className="normal-case text-slate-500 ml-1">(leave blank for walk-in)</span></label>
            <select {...f('customerId')} className="field-input">
              <option value="">Walk-in / No customer</option>
              {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
            </select>
          </div>

          <div className="col-span-2 border-t border-slate-200 pt-4">
            <label className="field-label">
              Product{' '}
              <span className="normal-case text-slate-500 ml-1">
                {editing ? '(all products shown for editing)' : '(showing in-stock items only)'}
              </span>
            </label>
            <select value={form.stockId} onChange={e => pickStock(e.target.value)} className="field-input">
              <option value="">— Select product —</option>
              {stocks.map(s => (
                <option key={s.stockId} value={s.stockId}>
                  {s.ourNo ? `${s.ourNo} · ` : ''}{s.name || s.description || 'Unnamed'} — {s.quantity} available
                </option>
              ))}
            </select>
          </div>

          {selStock && (
            <div className="col-span-2 bg-slate-100 rounded-lg px-4 py-3 grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-slate-700 font-mono text-sm">
                  {editing
                    ? (selStock.quantity ?? 0) + Number(editing.quantity ?? 0)
                    : selStock.quantity}
                </div>
                <div className="text-slate-600 text-xs mt-0.5">Available{editing ? ' (incl. this sale)' : ''}</div>
              </div>
              <div>
                <div className="text-slate-700 text-sm">{selStock.stockType || '—'}</div>
                <div className="text-slate-600 text-xs mt-0.5">Category</div>
              </div>
            </div>
          )}

          <div>
            <label className="field-label">Qty to Sell</label>
            <input {...f('quantity')} type="number" min="1" placeholder="0" />
          </div>
          <div className="col-span-2"><label className="field-label">Notes</label><input {...f('notes')} placeholder="Optional notes" /></div>
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
        title="Void Sale"
        message={`Void invoice "${delTarget?.invoiceNo}"? Stock will be returned and the record deleted.`}
      />
    </div>
  )
}
