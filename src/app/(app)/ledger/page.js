'use client'
import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import { fmtDate } from '@/lib/utils'

export default function LedgerPage() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [type,    setType]    = useState('All')
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')
  const [q,       setQ]       = useState('')
  const [printList, setPrintList] = useState(false)

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
  useEffect(() => {
    if (!printList) return
    const t = setTimeout(() => { window.print(); setPrintList(false) }, 50)
    return () => clearTimeout(t)
  }, [printList])

  return (
    <div>
      <PageHeader
        title="Ledger"
        subtitle="Sales & Purchases"
        actions={<button onClick={() => setPrintList(true)} className="btn-ghost">🖨 Print List</button>}
      />

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
        <button onClick={() => { setType('All'); setFrom(''); setTo(''); setQ('') }} className="btn-ghost text-slate-600">Reset</button>
      </div>

      {/* Ledger table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Invoice</th><th>Date</th><th>Product</th>
                <th>Party</th><th className="text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center text-slate-500 py-10">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="text-center text-slate-500 py-10">No records match the current filters</td></tr>}
              {rows.map(r => (
                <tr key={`${r.transactionType}-${r.saleId}`}>
                  <td><span className={r.transactionType === 'Sale' ? 'badge-sale' : 'badge-purchase'}>{r.transactionType}</span></td>
                  <td className="font-mono text-xs text-sky-600">{r.invoiceNo || '—'}</td>
                  <td className="text-xs text-slate-600 whitespace-nowrap">{fmtDate(r.txDate)}</td>
                  <td className="max-w-[160px]">
                    <div className="text-xs truncate">{r.stock?.name || r.stock?.description || '—'}</div>
                    <div className="text-xs text-slate-600 truncate">{r.stock?.ourNo}</div>
                  </td>
                  <td className="text-xs text-slate-600">
                    {r.transactionType === 'Sale'
                      ? (r.customer?.customerName || 'Walk-in')
                        : (r.supplierName || '—')}
                  </td>
                  <td className="text-right font-mono text-xs text-slate-700">{r.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions list print */}
      {printList && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', overflowY: 'auto' }}>
          <div className="print-area" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 12, color: '#1a1a1a', padding: '32px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>TRANSACTIONS REPORT</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Stock Management System</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {(() => {
                    const parts = [`Type: ${type}`]
                    if (from) parts.push(`From: ${from}`)
                    if (to) parts.push(`To: ${to}`)
                    if (q) parts.push(`Search: ${q}`)
                    return parts.join(' · ')
                  })()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 700, marginTop: 2 }}>{rows.length} record(s)</div>
              </div>
            </div>
            <div style={{ borderTop: '2px solid #2563eb', marginBottom: 16 }} />
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#eff6ff' }}>
                  {['Type', 'Invoice', 'Date', 'Party', 'Items', 'Qty'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 5 ? 'right' : 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#2563eb', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const its = r.items?.length > 0 ? r.items : r.stock ? [{ stock: r.stock, quantity: r.quantity }] : []
                  const names = its.map(it => it.stock?.name || it.stock?.description || it.stock?.ourNo || '?').join(', ')
                  const qty = its.reduce((s, it) => s + (it.quantity || 0), 0)
                  return (
                    <tr key={`${r.transactionType}-${r.saleId}`} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '7px 10px', fontSize: 11, fontWeight: 600, color: r.transactionType === 'Sale' ? '#7c3aed' : '#0369a1' }}>{r.transactionType}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{r.invoiceNo || '—'}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(r.txDate)}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11 }}>{r.transactionType === 'Sale' ? (r.customer?.customerName || 'Walk-in') : (r.supplierName || '—')}</td>
                      <td style={{ padding: '7px 10px', fontSize: 11, maxWidth: 220 }}>{names || '—'}</td>
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
