export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PrintControls from '@/components/PrintControls'

const COOKIE = 'sms_auth'
const PIN    = process.env.ACCESS_PIN || '1234'

export default async function PrintPurchasesPage({ searchParams }) {
  const token = (await cookies()).get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

  const sp = await searchParams
  const q  = sp?.q || ''

  const where = q
    ? { OR: [
        { invoiceNo:    { contains: q } },
        { gdNumber:     { contains: q } },
        { supplierName: { contains: q } },
        { items: { some: { stock: { OR: [{ ourNo: { contains: q } }, { name: { contains: q } }, { description: { contains: q } }] } } } },
      ], transactionType: 'Purchase' }
    : { transactionType: 'Purchase' }

  const purchases = await prisma.sale.findMany({
    where,
    orderBy: { txDate: 'desc' },
    include: { items: { include: { stock: true } }, stock: true },
  })

  const totalQty = purchases.reduce((sum, p) => {
    const qty = p.items && p.items.length > 0
      ? p.items.reduce((q, it) => q + (it.quantity || 0), 0)
      : (p.quantity || 0)
    return sum + qty
  }, 0)

  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  }

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
      <PrintControls accentColor="#0369a1" />

      {/* Document */}
      <div style={{ maxWidth: 960, margin: '32px auto', padding: '40px 48px', background: '#fff', boxShadow: '0 2px 24px rgba(0,0,0,.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5 }}>PURCHASES REPORT</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Stock Management System</div>
            {q && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Filter: {q}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{printDate}</div>
            <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 700, marginTop: 4 }}>{purchases.length} record(s)</div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #0369a1', marginBottom: 20 }} />

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 28 }}>
          {[['Total Purchases', purchases.length], ['Total Items Received', totalQty]].map(([label, val]) => (
            <div key={label} style={{ background: '#f0f9ff', borderRadius: 8, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Purchases table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f9ff' }}>
              {['Invoice', 'GD No.', 'Date', 'Supplier', 'Items', 'Qty'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 5 ? 'right' : 'left',
                  padding: '9px 10px',
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  color: '#0369a1',
                  borderBottom: '2px solid #e5e7eb',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>No purchases found</td></tr>
            )}
            {purchases.map((row, idx) => {
              const its = row.items && row.items.length > 0 ? row.items : (row.stock ? [{ stock: row.stock, quantity: row.quantity }] : [])
              const names = its.map(it => it.stock?.name || it.stock?.description || it.stock?.ourNo || '?').join(', ')
              const qty   = its.reduce((s, it) => s + (it.quantity || 0), 0)
              return (
                <tr key={row.saleId} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 1 ? '#fafafa' : '#fff' }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{row.invoiceNo || '—'}</td>
                  <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{row.gdNumber || '—'}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(row.txDate)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: '#374151' }}>{row.supplierName || '—'}</td>
                  <td style={{ padding: '8px 10px', fontSize: 11, color: '#374151', maxWidth: 240 }}>{names}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{qty}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f0f9ff', fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: '10px', textAlign: 'right', color: '#0369a1', fontSize: 12 }}>Total</td>
              <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, color: '#0369a1' }}>{totalQty}</td>
            </tr>
          </tfoot>
        </table>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 32, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
          <span>Generated by Stock Management System · {printDate}</span>
          <span>{purchases.length} record(s) printed</span>
        </div>
      </div>
    </>
  )
}
