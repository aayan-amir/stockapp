'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import { fmt, fmtDate } from '@/lib/utils'

export default function LedgerPage() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [type,    setType]    = useState('All')
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')
  const [q,       setQ]       = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    // Fetch both sales and purchases then filter client-side for rich filtering
    const [sales, purchases] = await Promise.all([
      fetch('/api/sales').then(r => r.json()),
      fetch('/api/purchases').then(r => r.json()),
    ])
    let all = [
      ...sales.map(r => ({ ...r, transactionType: 'Sale' })),
      ...purchases.map(r => ({ ...r, transactionType: 'Purchase' })),
    ].sort((a, b) => new Date(b.txDate) - new Date(a.txDate))

    if (type !== 'All') all = all.filter(r => r.transactionType === type)
    if (from) all = all.filter(r => new Date(r.txDate) >= new Date(from))
    if (to)   all = all.filter(r => new Date(r.txDate) <= new Date(to + 'T23:59:59'))
    if (q) {
      const lq = q.toLowerCase()
      all = all.filter(r =>
        r.invoiceNo?.toLowerCase().includes(lq) ||
        r.stock?.ourNo?.toLowerCase().includes(lq) ||
        r.stock?.description?.toLowerCase().includes(lq) ||
        r.customer?.customerName?.toLowerCase().includes(lq) ||
        r.supplierName?.toLowerCase().includes(lq)
      )
    }
    setRows(all); setLoading(false)
  }, [type, from, to, q])

  useEffect(() => { load() }, [load])

  const totalSales     = rows.filter(r => r.transactionType === 'Sale').reduce((s, r) => s + (r.totalPKR || 0), 0)
  const totalPurchases = rows.filter(r => r.transactionType === 'Purchase').reduce((s, r) => s + (r.totalPKR || 0), 0)

  return (
    <div>
      <PageHeader title="Ledger" subtitle="Sales & Purchases" />

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div>
          <label className="field-label">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="field-input w-32">
            <option>All</option><option>Sale</option><option>Purchase</option>
          </select>
        </div>
        <div>
          <label className="field-label">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="field-input w-36" />
        </div>
        <div>
          <label className="field-label">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="field-input w-36" />
        </div>
        <div className="flex-1">
          <label className="field-label">Search</label>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Invoice, product, party…" className="field-input" />
        </div>
        <button onClick={load} className="btn-gold">Filter</button>
        <button onClick={() => { setType('All'); setFrom(''); setTo(''); setQ('') }} className="btn-ghost text-white/40">Reset</button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="stat-card">
          <div className="stat-value text-success">₨ {fmt(totalSales)}</div>
          <div className="stat-label">Total Sales</div>
          <div className="text-white/20 text-xs mt-1">{rows.filter(r => r.transactionType === 'Sale').length} transaction(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-warn">₨ {fmt(totalPurchases)}</div>
          <div className="stat-label">Total Purchases</div>
          <div className="text-white/20 text-xs mt-1">{rows.filter(r => r.transactionType === 'Purchase').length} transaction(s)</div>
        </div>
      </div>

      {/* Ledger table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Invoice</th><th>Date</th><th>Product</th>
                <th>Party</th><th className="text-right">Qty</th>
                <th className="text-right">Unit FCY</th><th>Cur</th>
                <th className="text-right">Tax%</th><th className="text-right">Freight</th>
                <th className="text-right">Total PKR</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={11} className="text-center text-white/20 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={11} className="text-center text-white/20 py-10">No records match the current filters</td></tr>}
              {rows.map(r => (
                <tr key={`${r.transactionType}-${r.saleId}`}>
                  <td><span className={r.transactionType === 'Sale' ? 'badge-sale' : 'badge-purchase'}>{r.transactionType}</span></td>
                  <td className="font-mono text-xs text-accent/60">{r.invoiceNo || '—'}</td>
                  <td className="text-xs text-white/40 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td className="max-w-[160px]">
                    <div className="text-xs text-accent/70 truncate">{r.stock?.ourNo || '—'}</div>
                    <div className="text-xs text-white/30 truncate">{r.stock?.description}</div>
                  </td>
                  <td className="text-xs text-white/50">
                    {r.transactionType === 'Sale'
                      ? (r.customer?.customerName || 'Walk-in')
                      : (r.supplierName || '—')}
                  </td>
                  <td className="text-right font-mono text-xs">{r.quantity}</td>
                  <td className="text-right font-mono text-xs text-white/50">{fmt(r.unitPriceFCY)}</td>
                  <td className="text-xs text-white/30">{r.currencyCode}</td>
                  <td className="text-right font-mono text-xs text-white/40">{r.taxRateUsed}%</td>
                  <td className="text-right font-mono text-xs text-white/40">{fmt(r.freightPKR)}</td>
                  <td className={`text-right font-mono text-sm font-semibold ${r.transactionType === 'Sale' ? 'text-success' : 'text-gold'}`}>
                    ₨ {fmt(r.totalPKR)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
