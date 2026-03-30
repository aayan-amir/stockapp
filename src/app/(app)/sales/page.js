'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'
import { fmt, fmtDate, calcTotal, today } from '@/lib/utils'

const EMPTY = {
  invoiceNo:'', txDate: today(), customerId:'', notes:'',
  stockId:'', quantity:'', taxRateUsed:'18', freightPKR:'', otherChargesPKR:'',
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
  const [taxRates,   setTaxRates]  = useState([])
  const [selStock,   setSelStock]  = useState(null)   // full stock record
  const [q,          setQ]         = useState('')
  const [delTarget,  setDelTarget] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/sales${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
    fetch('/api/tax-rates').then(r => r.json()).then(setTaxRates)
  }, [])

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  function pickStock(id) {
    const s = stocks.find(s => s.stockId === Number(id))
    setSelStock(s || null)
    setForm(p => ({ ...p, stockId: id }))
  }

  const exRate = selStock ? (selStock.foreignCurrency === 'PKR' ? 1 : 1) : 1  // resolved via currency table on backend
  const totals = calcTotal({
    qty:     Number(form.quantity),
    unitFCY: selStock?.foreignCurrencyPrice || 0,
    exRate:  1,   // backend resolves; show PKR estimate using stored price
    taxRate: Number(form.taxRateUsed),
    freight: Number(form.freightPKR),
    other:   Number(form.otherChargesPKR),
  })

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Sale')
    const d = await r.json()
    setForm(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  async function handleSave() {
    setError('')
    if (!form.invoiceNo)           return setError('Generate or enter an Invoice Number')
    if (!form.stockId)             return setError('Select a product')
    if (Number(form.quantity) <= 0) return setError('Enter quantity to sell')
    if (!selStock)                 return setError('Product not found')
    if (Number(form.quantity) > selStock.quantity) return setError(`Only ${selStock.quantity} unit(s) available`)

    setSaving(true)
    const payload = {
      ...form,
      unitPriceFCY:     selStock.foreignCurrencyPrice || 0,
      currencyCode:     selStock.foreignCurrency || 'PKR',
      exchangeRateUsed: 1,
      totalPKR:         totals.total,
    }
    const res = await fetch('/api/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); setSaving(false); return }
    setSaving(false); setModal(false); setForm(EMPTY); setSelStock(null); load()
    // Refresh stock list (qty changed)
    fetch('/api/stock').then(r => r.json()).then(d => setStocks(d.filter(s => s.quantity > 0)))
  }

  async function handleDelete() {
    await fetch(`/api/sales/${delTarget.saleId}`, { method: 'DELETE' })
    setDelTarget(null); load()
  }

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle={`${rows.length} record(s)`}
        actions={<button onClick={() => { setForm(EMPTY); setSelStock(null); setError(''); setModal(true) }} className="btn-gold">+ Record Sale</button>}
      />

      <div className="flex gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search invoice, customer, product…" className="field-input flex-1" />
        <button onClick={load} className="btn-ghost">Search</button>
        <button onClick={() => setQ('')} className="btn-ghost text-white/30">Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Product</th><th>Customer</th><th className="text-right">Qty</th><th className="text-right">Tax %</th><th className="text-right">Total PKR</th><th></th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center text-white/20 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={8} className="text-center text-white/20 py-10">No sales yet</td></tr>}
              {rows.map(r => (
                <tr key={r.saleId}>
                  <td className="font-mono text-xs text-accent/70">{r.invoiceNo || '—'}</td>
                  <td className="text-xs text-white/40 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td>{r.stock?.ourNo || '—'} <span className="text-white/30 text-xs">{r.stock?.description}</span></td>
                  <td className="text-white/50 text-xs">{r.customer?.customerName || 'Walk-in'}</td>
                  <td className="text-right font-mono text-xs">{r.quantity}</td>
                  <td className="text-right font-mono text-xs text-white/40">{r.taxRateUsed}%</td>
                  <td className="text-right font-mono text-sm text-gold">₨ {fmt(r.totalPKR)}</td>
                  <td>
                    <button onClick={() => setDelTarget(r)} className="text-danger/30 hover:text-danger text-xs transition-colors">Void</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record a Sale" wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...f('invoiceNo')} placeholder="SALE-20240101-001" className="field-input flex-1" />
              <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>
            </div>
          </div>
          <div><label className="field-label">Sale Date</label><input {...f('txDate')} type="date" /></div>
          <div className="col-span-2">
            <label className="field-label">Customer <span className="normal-case text-white/20 ml-1">(leave blank for walk-in)</span></label>
            <select {...f('customerId')} className="field-input">
              <option value="">Walk-in / No customer</option>
              {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.customerName}</option>)}
            </select>
          </div>

          <div className="col-span-2 border-t border-white/10 pt-4">
            <label className="field-label">Product <span className="normal-case text-white/20 ml-1">(showing in-stock items only)</span></label>
            <select value={form.stockId} onChange={e => pickStock(e.target.value)} className="field-input">
              <option value="">— Select product —</option>
              {stocks.map(s => (
                <option key={s.stockId} value={s.stockId}>
                  {s.ourNo ? `${s.ourNo} · ` : ''}{s.description || 'Unnamed'} — {s.quantity} available
                </option>
              ))}
            </select>
          </div>

          {selStock && (
            <div className="col-span-2 bg-navy-200 rounded-lg px-4 py-3 grid grid-cols-3 gap-3 text-center">
              <div><div className="text-accent font-mono text-sm">{selStock.foreignCurrency || 'PKR'} {fmt(selStock.foreignCurrencyPrice || 0)}</div><div className="text-white/30 text-xs mt-0.5">Unit Price FCY</div></div>
              <div><div className="text-white/60 font-mono text-sm">{selStock.quantity}</div><div className="text-white/30 text-xs mt-0.5">Available</div></div>
              <div><div className="text-white/60 text-sm">{selStock.stockType || '—'}</div><div className="text-white/30 text-xs mt-0.5">Category</div></div>
            </div>
          )}

          <div>
            <label className="field-label">Qty to Sell</label>
            <input {...f('quantity')} type="number" min="1" max={selStock?.quantity} placeholder="0" />
          </div>
          <div>
            <label className="field-label">Tax Rate</label>
            <select {...f('taxRateUsed')} className="field-input">
              {taxRates.map(t => <option key={t.taxRateId} value={t.taxRatePercent}>{t.taxName} ({t.taxRatePercent}%)</option>)}
            </select>
          </div>
          <div><label className="field-label">Freight (PKR)</label><input {...f('freightPKR')} type="number" step="0.01" placeholder="0.00" /></div>
          <div><label className="field-label">Other Charges (PKR)</label><input {...f('otherChargesPKR')} type="number" step="0.01" placeholder="0.00" /></div>
          <div className="col-span-2"><label className="field-label">Notes</label><input {...f('notes')} placeholder="Optional notes" /></div>

          {/* Total breakdown */}
          <div className="col-span-2 bg-navy-200 rounded-xl p-4 grid grid-cols-3 gap-4 text-center mt-1">
            <div><div className="text-white/50 font-mono text-sm">₨ {fmt(totals.sub)}</div><div className="text-accent/50 text-xs mt-0.5">Subtotal</div></div>
            <div><div className="text-white/50 font-mono text-sm">₨ {fmt(totals.tax)}</div><div className="text-accent/50 text-xs mt-0.5">Tax</div></div>
            <div><div className="text-gold font-mono font-bold text-lg">₨ {fmt(totals.total)}</div><div className="text-accent/50 text-xs mt-0.5">TOTAL PKR</div></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-gold">{saving ? 'Saving…' : 'Confirm & Save'}</button>
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
