'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fmtDate } from '@/lib/utils'

function StatCard({ label, value, sub, color = 'text-gold' }) {
  return (
    <div className="stat-card">
      <div className={`text-2xl font-bold font-mono tabular-nums ${color}`}>{value}</div>
      <div className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-1">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 text-sm gap-2">
      <span className="animate-spin">◌</span> Loading dashboard…
    </div>
  )

  const { totalStockItems, totalStockQty, lowStockItems,
          monthSalesCount, monthPurchasesCount,
          recentTx, topProducts } = data

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gold">Dashboard</h1>
        <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Stock Items"      value={totalStockItems}           sub={`${totalStockQty} total units`} />
        <StatCard label="Low Stock Alerts" value={lowStockItems}             color={lowStockItems > 0 ? 'text-danger' : 'text-success'} sub="≤ 5 units remaining" />
        <StatCard label="Sales This Month" value={monthSalesCount} color="text-success" sub="invoice(s)" />
        <StatCard label="Purchases This Month" value={monthPurchasesCount} color="text-warn" sub="order(s)" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent transactions */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700 text-sm">Recent Transactions</h2>
            <Link href="/ledger" className="text-sky-600 text-xs hover:text-sky-700 transition-colors">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th><th>Type</th><th>Product</th><th>Party</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-slate-500 py-8">No transactions yet</td></tr>
                )}
                {recentTx.map(tx => (
                  <tr key={tx.saleId}>
                    <td className="font-mono text-xs text-sky-600">{tx.invoiceNo || '—'}</td>
                    <td><span className={tx.transactionType === 'Sale' ? 'badge-sale' : 'badge-purchase'}>{tx.transactionType}</span></td>
                    <td className="max-w-[140px] truncate text-slate-700">{tx.stock?.ourNo || '—'} {tx.stock?.description ? `· ${tx.stock.description}` : ''}</td>
                    <td className="text-slate-600 text-xs">{tx.transactionType === 'Sale' ? (tx.customer?.customerName || 'Walk-in') : (tx.supplierName || '—')}</td>
                    <td className="text-slate-600 text-xs whitespace-nowrap">{fmtDate(tx.txDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top selling products */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700 text-sm">Top Selling Products</h2>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No sales yet</p>}
            {topProducts.map((t, i) => (
              <div key={t.stockId} className="flex items-center gap-3">
                <span className="text-slate-500 font-mono text-xs w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700 truncate">{t.stock?.ourNo || '—'}</div>
                  <div className="text-xs text-slate-600 truncate">{t.stock?.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-600">{t._sum.quantity} sold</div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 pb-4 pt-2 border-t border-slate-200">
            <Link href="/sales" className="text-sky-600 text-xs hover:text-sky-700 transition-colors">All sales →</Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/purchases', label: 'Record Purchase', icon: '↓', color: 'border-gold/20 hover:border-gold/50' },
          { href: '/sales',     label: 'Record Sale',     icon: '↑', color: 'border-success/20 hover:border-success/50' },
          { href: '/stock',     label: 'Browse Stock',    icon: '▦', color: 'border-accent/20 hover:border-accent/50' },
          { href: '/customers', label: 'Customers',       icon: '◎', color: 'border-slate-200 hover:border-slate-400' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`flex items-center gap-3 p-4 rounded-xl bg-slate-50 border transition-colors ${a.color}`}>
            <span className="text-2xl text-slate-600">{a.icon}</span>
            <span className="text-sm font-semibold text-slate-600">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
