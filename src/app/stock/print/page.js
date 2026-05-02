import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const COOKIE = 'sms_auth'
const PIN    = process.env.ACCESS_PIN || '1234'

export default async function PrintStockPage({ searchParams }) {
  const token = (await cookies()).get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

  const sp    = await searchParams
  const q     = sp?.q     || ''
  const field = sp?.field || ''

  const where = q && field
    ? { [field]: { contains: q, mode: 'insensitive' } }
    : q
    ? {
        OR: [
          { ourNo:       { contains: q, mode: 'insensitive' } },
          { name:        { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const stocks = await prisma.stock.findMany({
    where,
    orderBy: { ourNo: 'asc' },
  })

  const totalIn  = stocks.reduce((s, r) => s + (r.stockIn  || 0), 0)
  const totalOut = stocks.reduce((s, r) => s + (r.stockOut || 0), 0)
  const totalQty = stocks.reduce((s, r) => s + (r.quantity || 0), 0)

  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          table { page-break-inside: auto; }
          tr    { page-break-inside: avoid; }
        }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }
      `}</style>

      {/* Screen controls */}
      <div className="no-print" style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          🖨 Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          Close
        </button>
        <span style={{ color: '#64748b', fontSize: 12, marginLeft: 8 }}>Tip: choose "Save as PDF" in the print dialog for a PDF copy.</span>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 960, margin: '32px auto', padding: '40px 48px', background: '#fff', boxShadow: '0 2px 24px rgba(0,0,0,.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5 }}>STOCK REPORT</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Stock Management System</div>
            {q && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Filter: {q}{field ? ` (${field})` : ''}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{printDate}</div>
            <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700, marginTop: 4 }}>{stocks.length} item(s)</div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #7c3aed', marginBottom: 20 }} />

        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
          {[['Total In', totalIn], ['Total Out', totalOut], ['Net Available', totalQty]].map(([label, val]) => (
            <div key={label} style={{ background: '#f8f5ff', borderRadius: 8, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed', fontFamily: 'monospace' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Stock table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f5ff' }}>
              {['Our No.', 'OEM No.', 'Name / Description', 'Category', 'Supplier', 'In', 'Out', 'Qty'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i >= 5 ? 'right' : 'left',
                  padding: '9px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: '#7c3aed',
                  borderBottom: '2px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No stock items found</td></tr>
            )}
            {stocks.map((row, idx) => (
              <tr key={row.stockId} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 1 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{row.ourNo || '—'}</td>
                <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{row.oemNo || '—'}</td>
                <td style={{ padding: '8px 10px', color: '#1a1a1a', maxWidth: 220 }}>
                  {row.name && <div style={{ fontWeight: 500 }}>{row.name}</div>}
                  {row.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{row.description}</div>}
                  {!row.name && !row.description && <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</span>}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 11, color: '#374151' }}>
                  {row.stockType ? <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>{row.stockType}</span> : '—'}
                </td>
                <td style={{ padding: '8px 10px', fontSize: 11, color: '#6b7280' }}>{row.supplier || '—'}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#059669' }}>{row.stockIn}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color: '#dc2626' }}>{row.stockOut}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: row.quantity <= 0 ? '#dc2626' : row.quantity <= 5 ? '#d97706' : '#059669' }}>
                  {row.quantity}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8f5ff', fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: '10px', textAlign: 'right', color: '#7c3aed', fontSize: 12 }}>Totals</td>
              <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#059669' }}>{totalIn}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#dc2626' }}>{totalOut}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#7c3aed' }}>{totalQty}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 32, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
          <span>Generated by Stock Management System · {printDate}</span>
          <span>{stocks.length} record(s) printed</span>
        </div>
      </div>
    </>
  )
}
