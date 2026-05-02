import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PrintControls from '@/components/PrintControls'

const COOKIE = 'sms_auth'
const PIN    = process.env.ACCESS_PIN || '1234'

export default async function PrintInvoicePage({ params }) {
  const token = (await cookies()).get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

  const { id } = await params
  const sale = await prisma.sale.findUnique({
    where:   { saleId: Number(id) },
    include: {
      customer: true,
      items:    { include: { stock: true } },
      stock:    true,
    },
  })

  if (!sale) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
        <h1>Document not found</h1>
      </div>
    )
  }

  const isPurchase = sale.transactionType === 'Purchase'
  const docTitle   = isPurchase ? 'PURCHASE ORDER' : 'INVOICE'
  const accentColor = isPurchase ? '#0369a1' : '#7c3aed'
  const bgAccent    = isPurchase ? '#f0f9ff' : '#f8f5ff'

  // Normalise line items – support both new multi-item and legacy single-item records
  const lineItems = sale.items && sale.items.length > 0
    ? sale.items
    : (sale.stock ? [{ stock: sale.stock, quantity: sale.quantity }] : [])

  const totalQty = lineItems.reduce((s, it) => s + (it.quantity || 0), 0)
  const dateStr  = sale.txDate
    ? new Date(sale.txDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const customer = sale.customer

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; margin: 0; padding: 0; }
      `}</style>

      {/* Screen controls */}
      <PrintControls accentColor={accentColor} />

      {/* Document */}
      <div style={{ maxWidth: 720, margin: '32px auto', padding: '40px 48px', background: '#fff', boxShadow: '0 2px 24px rgba(0,0,0,.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5 }}>{docTitle}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Stock Management System</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: accentColor, fontFamily: 'monospace' }}>{sale.invoiceNo || '—'}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{dateStr}</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `2px solid ${accentColor}`, marginBottom: 28 }} />

        {/* Bill to / PO details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>
              {isPurchase ? 'Supplier' : 'Bill To'}
            </div>
            {isPurchase ? (
              sale.supplierName
                ? <div style={{ fontWeight: 700, fontSize: 15 }}>{sale.supplierName}</div>
                : <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No supplier recorded</div>
            ) : (
              customer ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{customer.customerName}</div>
                  {customer.address     && <div style={{ color: '#6b7280', marginTop: 2 }}>{customer.address}</div>}
                  {customer.phoneNumber && <div style={{ color: '#6b7280', marginTop: 1 }}>📞 {customer.phoneNumber}</div>}
                  {customer.email       && <div style={{ color: '#6b7280', marginTop: 1 }}>✉ {customer.email}</div>}
                  {customer.ntn         && <div style={{ color: '#6b7280', marginTop: 1 }}>NTN: <b>{customer.ntn}</b></div>}
                  {customer.gstNumber   && <div style={{ color: '#6b7280', marginTop: 1 }}>GST: <b>{customer.gstNumber}</b></div>}
                </>
              ) : (
                <div style={{ color: '#6b7280', fontStyle: 'italic' }}>Walk-in Customer</div>
              )
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>Details</div>
            <table style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>{isPurchase ? 'PO No.' : 'Invoice No.'}</td>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{sale.invoiceNo || '—'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Date</td>
                  <td>{dateStr}</td>
                </tr>
                {isPurchase && sale.gdNumber && (
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>GD Number</td>
                    <td style={{ fontFamily: 'monospace' }}>{sale.gdNumber}</td>
                  </tr>
                )}
                {!isPurchase && customer?.filerStatus && (
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Filer Status</td>
                    <td>{customer.filerStatus}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: bgAccent }}>
              {['#', 'Our No.', 'Description', 'Qty'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: accentColor, borderBottom: '1px solid #e5e7eb' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((it, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{it.stock?.ourNo || '—'}</td>
                <td style={{ padding: '10px 12px', color: '#1a1a1a' }}>
                  <div style={{ fontWeight: 500 }}>{it.stock?.name || it.stock?.description || 'Unnamed item'}</div>
                  {it.stock?.oemNo && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>OEM: {it.stock.oemNo}</div>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{it.quantity}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: bgAccent }}>
              <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: accentColor }}>Total Quantity</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: accentColor }}>{totalQty}</td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {sale.notes && (
          <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Notes</div>
            <div style={{ color: '#4b5563' }}>{sale.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Generated by Stock Management System</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 32 }}>Authorised Signature</div>
            <div style={{ borderTop: '1px solid #374151', paddingTop: 4, fontSize: 11, color: '#6b7280', width: 160 }}>Signature</div>
          </div>
        </div>

      </div>
    </>
  )
}
