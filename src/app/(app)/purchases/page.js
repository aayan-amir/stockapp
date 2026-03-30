'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import { fmt, fmtDate, calcTotal, today } from '@/lib/utils'

const EMPTY_FORM = {
  invoiceNo:'', txDate: today(), supplierName:'', notes:'',
  stockId:'', quantity:'', unitPriceFCY:'', currencyCode:'PKR',
  exchangeRateUsed:'1', taxRateUsed:'18', freightPKR:'', otherChargesPKR:'',
}

export default function PurchasesPage() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [stocks,     setStocks]     = useState([])
  const [currencies, setCurrencies] = useState([])
  const [taxRates,   setTaxRates]   = useState([])
  const [q,          setQ]          = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const p = q ? `?q=${encodeURIComponent(q)}` : ''
    fetch(`/api/purchases${p}`).then(r => r.json()).then(d => { setRows(d); setLoading(false) })
  }, [q])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetch('/api/stock').then(r => r.json()).then(setStocks)
    fetch('/api/currencies').then(r => r.json()).then(setCurrencies)
    fetch('/api/taxrates').then(r => r.json()).then(setTaxRates)
  }, [])

  function f(k) { return { value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' } }

  const totals = calcTotal({
    qty:      Number(form.quantity),
    unitFCY:  Number(form.unitPriceFCY),
    exRate:   Number(form.exchangeRateUsed) || 1,
    taxRate:  Number(form.taxRateUsed),
    freight:  Number(form.freightPKR),
    other:    Number(form.otherChargesPKR),
  })

  async function genInvoice() {
    const r = await fetch('/api/invoice?type=Purchase')
    const d = await r.json()
    setForm(p => ({ ...p, invoiceNo: d.invoiceNo }))
  }

  function pickCurrency(code) {
    const rate = currencies.find(c => c.currencyCode === code)
    setForm(p => ({ ...p, currencyCode: code, exchangeRateUsed: rate ? rate.exchangeRateToPKR : 1 }))
  }

  function pickStock(id) {
    const s = stocks.find(s => s.stockId === Number(id))
    if (!s) return setForm(p => ({ ...p, stockId: id }))
    const cur  = s.foreignCurrency || 'PKR'
    const rate = currencies.find(c => c.currencyCode === cur)
    setForm(p => ({
      ...p, stockId: id,
      currencyCode:     cur,
      exchangeRateUsed: rate ? String(rate.exchangeRateToPKR) : '1',
      unitPriceFCY:     s.foreignCurrencyPrice ? String(s.foreignCurrencyPrice) : '',
      supplierName:     p.supplierName || s.supplier || '',
    }))
  }

  async function handleSave() {
    setError('')
    if (!form.invoiceNo)   return setError('Generate or enter an Invoice Number')
    if (!form.stockId)     return setError('Select a product')
    if (Number(form.quantity) <= 0) return setError('Quantity must be > 0')
    if (Number(form.unitPriceFCY) <= 0) return setError('Unit price must be > 0')
    setSaving(true)
    const res = await fetch('/api/purchases', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, totalPKR: totals.total }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); setSaving(false); return }
    setSaving(false); setModal(false); setForm(EMPTY_FORM); load()
  }

  return (
    <div>
      <PageHeader
        title="Purchases"
        subtitle={`${rows.length} record(s)`}
        actions={<button onClick={() => { setForm(EMPTY_FORM); setError(''); setModal(true) }} className="btn-gold">+ Record Purchase</button>}
      />

      {/* Search */}
      <div className="flex gap-2 mb-5">
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search invoice, supplier, product…" className="field-input flex-1" />
        <button onClick={load} className="btn-ghost">Search</button>
        <button onClick={() => setQ('')} className="btn-ghost text-white/30">Clear</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Product</th><th>Supplier</th><th className="text-right">Qty</th><th>Currency</th><th className="text-right">Unit FCY</th><th className="text-right">Tax %</th><th className="text-right">Total PKR</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="text-center text-white/20 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={9} className="text-center text-white/20 py-10">No purchases yet</td></tr>}
              {rows.map(r => (
                <tr key={r.saleId}>
                  <td className="font-mono text-xs text-accent/70">{r.invoiceNo || '—'}</td>
                  <td className="text-xs text-white/40 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td>{r.stock?.ourNo || '—'} <span className="text-white/30 text-xs">{r.stock?.description}</span></td>
                  <td className="text-white/50 text-xs">{r.supplierName || '—'}</td>
                  <td className="text-right font-mono text-xs">{r.quantity}</td>
                  <td className="text-xs text-white/40">{r.currencyCode}</td>
                  <td className="text-right font-mono text-xs">{fmt(r.unitPriceFCY)}</td>
                  <td className="text-right font-mono text-xs text-white/40">{r.taxRateUsed}%</td>
                  <td className="text-right font-mono text-sm text-gold">₨ {fmt(r.totalPKR)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase form modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Record a Purchase" wide>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg p-3 mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          {/* Invoice row */}
          <div>
            <label className="field-label">Invoice No</label>
            <div className="flex gap-2">
              <input {...f('invoiceNo')} placeholder="PO-20240101-001" className="field-input flex-1" />
              <button onClick={genInvoice} className="btn-ghost btn-sm whitespace-nowrap">Auto</button>
            </div>
          </div>
          <div><label className="field-label">Purchase Date</label><input {...f('txDate')} type="date" /></div>
          <div><label className="field-label">Supplier</label><input {...f('supplierName')} placeholder="Supplier name" /></div>
          <div><label className="field-label">Notes</label><input {...f('notes')} placeholder="Optional notes" /></div>

          <div className="col-span-2 border-t border-white/10 pt-4">
            <label className="field-label">Product</label>
            <select value={form.stockId} onChange={e => pickStock(e.target.value)} className="field-input">
              <option value="">— Select product —</option>
              {stocks.map(s => (
                <option key={s.stockId} value={s.stockId}>
                  {s.ourNo ? `${s.ourNo} · ` : ''}{s.description || 'Unnamed'} [{s.stockType || 'No cat'}] — {s.quantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div><label className="field-label">Qty Purchased</label><input {...f('quantity')} type="number" min="1" placeholder="0" /></div>
          <div><label className="field-label">Unit Price (FCY)</label><input {...f('unitPriceFCY')} type="number" step="0.01" placeholder="0.00" /></div>
          <div>
            <label className="field-label">Currency</label>
            <select value={form.currencyCode} onChange={e => pickCurrency(e.target.value)} className="field-input">
              {currencies.map(c => <option key={c.rateId} value={c.currencyCode}>{c.currencyCode} – {c.currencyName}</option>)}
            </select>
          </div>
          <div><label className="field-label">Exchange Rate (PKR)</label><input {...f('exchangeRateUsed')} type="number" step="0.01" /></div>
          <div>
            <label className="field-label">Tax Rate</label>
            <select value={form.taxRateUsed} onChange={e => setForm(p => ({ ...p, taxRateUsed: e.target.value }))} className="field-input">
              {taxRates.map(t => <option key={t.taxRateId} value={t.taxRatePercent}>{t.taxName} ({t.taxRatePercent}%)</option>)}
            </select>
          </div>
          <div><label className="field-label">Freight (PKR)</label><input {...f('freightPKR')} type="number" step="0.01" placeholder="0.00" /></div>
          <div><label className="field-label">Other Charges (PKR)</label><input {...f('otherChargesPKR')} type="number" step="0.01" placeholder="0.00" /></div>

          {/* Totals summary */}
          <div className="col-span-2 bg-navy-200 rounded-xl p-4 grid grid-cols-3 gap-4 text-center mt-2">
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
    </div>
  )
}
