'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import InvoicePrint from '@/components/InvoicePrint'
import { fmtDate, today } from '@/lib/utils'

const EMPTY_HEADER = { invoiceNo: '', txDate: today(), customerId: '', notes: '' }
const EMPTY_ITEM   = { stockId: '', quantity: '' }

export default function SalesPage() {
  const [rows,      setRows]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [header,    setHeader]    = useState(EMPTY_HEADER)
  const [lineItems, setLineItems] = useState([{ ...EMPTY_ITEM }])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [stocks,    setStocks]    = useState([])
  const [customers, setCustomers] = useState([])
  const [q,         setQ]         = useState('')
  const [delTarget, setDelTarget] = useState(null)
  const [editing,   setEditing]   = useState(null)
  const [printItem, setPrintItem] = useState(null)
  const [printList, setPrintList] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/sales${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(setStocks)
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  useEffect(() => {
    if (!printItem) return
    const t = setTimeout(() => { window.print(); setPrintItem(null) }, 50)
    return () => clearTimeout(t)
  }, [printItem])

  useEffect(() => {
    if (!printList) return
    const t = setTimeout(() => { window.print(); setPrintList(false) }, 50)
    return () => clearTimeout(t)
  }, [printList])

  const fh = k => ({ value: header[k] ?? '', onChange: e => setHeader(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  function updateItem(idx, field, val) {
    setLineItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }
  function addItem()    { setLineItems(prev => [...prev, { ...EMPTY_ITEM }]) }
  function removeItem(idx) { setLineItems(prev => prev.filter((_, i) => i !== idx)) }

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Sale')
    const d = await r.json()
    setHeader(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  function openNew() {
    setEditing(null)
    setHeader(EMPTY_HEADER)
    setLineItems([{ ...EMPTY_ITEM }])
    setError('')
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
    setModal(true)
  }

  function openEdit(row) {
    setEditing(row)
    setHeader({
      invoiceNo:  row.invoiceNo  || '',
      txDate:     row.txDate ? row.txDate.slice(0, 10) : today(),
      customerId: row.customerId ? String(row.customerId) : '',
      notes:      row.notes      || '',
    })
    // Populate line items from new-style items[] or fall back to legacy stockId/quantity
    const its = row.items && row.items.length > 0
      ? row.items.map(it => ({ stockId: String(it.stockId || ''), quantity: String(it.quantity || '') }))
      : (row.stockId ? [{ stockId: String(row.stockId), quantity: String(row.quantity || '') }] : [{ ...EMPTY_ITEM }])
    setLineItems(its)
    setError('')
    fetch('/api/stock').then(r => r.json()).then(setStocks)
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
    const url    = editing ? `/api/sales/${editing.saleId}` : '/api/sales'
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
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  async function handleDelete() {
    await fetch(`/api/sales/${delTarget.saleId}`, { method: 'DELETE' })
    setDelTarget(null)
    load()
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  // Summarise items for the table row
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
        title="Sales"
        subtitle={`${rows.length} record(s)`}
        actions={<div className="flex gap-2"><button onClick={() => setPrintList(true)} className="btn-ghost">🖨 Print List</button><button onClick={openNew} className="btn-gold">+ Record Sale</button></div>}
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
                <th>Invoice</th><th>Date</th><th>Items</th><th>Customer</th>
                <th className="text-right">Total Qty</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-10">No sales yet</td></tr>}
              {rows.map(r => {
                const { names, totalQty } = itemSummary(r)
                return (
                  <tr key={r.saleId}>
                    <td className="font-mono text-xs text-sky-600">{r.invoiceNo || '—'}</td>
                    <td className="text-xs text-slate-600 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                    <td className="text-xs text-slate-700 max-w-[220px] truncate">{names}</td>
                    <td className="text-slate-600 text-xs">{r.customer?.customerName || 'Walk-in'}</td>
                    <td className="text-right font-mono text-xs text-slate-700">{totalQty}</td>
                    <td className="whitespace-nowrap">
                      <button onClick={() => setPrintItem(r)} className="text-emerald-600 hover:text-emerald-500 text-xs mr-3 transition-colors">Print</button>
                      <button onClick={() => openEdit(r)} className="text-sky-600 hover:text-sky-700 text-xs mr-3 transition-colors">Edit</button>
                      <button onClick={() => setDelTarget(r)} className="text-danger/80 hover:text-danger text-xs transition-colors">Void</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Edit Sale · ${editing.invoiceNo || ''}` : 'Record a Sale'} wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}

        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...fh('invoiceNo')} placeholder="SALE-20240101-001" className="field-input flex-1" />
              {!editing && <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>}
            </div>
          </div>
          <div><label className="field-label">Sale Date</label><input {...fh('txDate')} type="date" /></div>
          <div className="col-span-2">
            <label className="field-label">Customer <span className="normal-case text-slate-500 ml-1">(leave blank for walk-in)</span></label>
            <select {...fh('customerId')} className="field-input">
              <option value="">Walk-in / No customer</option>
              {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
            </select>
          </div>
        </div>

        {/* Line items */}
        <div className="border-t border-zinc-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="field-label mb-0">Line Items</span>
            <button onClick={addItem} className="btn-ghost btn-sm">+ Add Item</button>
          </div>

          <div className="space-y-2">
            {lineItems.map((item, idx) => {
              const selStock = stocks.find(s => s.stockId === Number(item.stockId))
              return (
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
                          {s.ourNo ? `${s.ourNo} · ` : ''}{s.name || s.description || 'Unnamed'} — {s.quantity} avail.
                        </option>
                      ))}
                    </select>
                    {selStock && (
                      <div className="text-xs text-slate-500 mt-0.5 pl-1">
                        Available: {selStock.quantity} · {selStock.stockType || ''}
                      </div>
                    )}
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
              )
            })}
          </div>
        </div>

        <div className="mt-4">
          <label className="field-label">Notes</label>
          <input {...fh('notes')} placeholder="Optional notes" />
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

      {/* Individual invoice print */}
      {printItem && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto' }}>
          <div className="print-area">
            <InvoicePrint sale={printItem} />
          </div>
        </div>
      )}

      {/* Sales list print */}
      {printList && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto' }}>
          <div className="print-area" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 12, color: '#1a1a1a', padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>SALES REPORT</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Stock Management System</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 2 }}>{rows.length} record(s)</div>
              </div>
            </div>
            <div style={{ borderTop: '2px solid #7c3aed', marginBottom: 16 }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f5ff' }}>
                  {['Invoice', 'Date', 'Customer', 'Items', 'Qty'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 4 ? 'right' : 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const its = r.items?.length > 0 ? r.items : r.stock ? [{ stock: r.stock, quantity: r.quantity }] : []
                  const names = its.map(it => it.stock?.name || it.stock?.description || it.stock?.ourNo || '?').join(', ')
                  const qty   = its.reduce((s, it) => s + (it.quantity || 0), 0)
                  return (
                    <tr key={r.saleId} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{r.invoiceNo || '—'}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(r.txDate)}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{r.customer?.customerName || 'Walk-in'}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, maxWidth: 240 }}>{names}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{qty}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 20, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
              <span>Generated by Stock Management System</span>
              <span>{rows.length} record(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
