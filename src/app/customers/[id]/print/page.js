import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PrintControls from '@/components/PrintControls'

const COOKIE = 'sms_auth'
const PIN    = process.env.ACCESS_PIN || '1234'

export default async function PrintCustomerPage({ params }) {
  const token = (await cookies()).get(COOKIE)?.value
  if (token !== PIN) redirect('/login')

  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where:   { customerId: Number(id) },
    include: {
      sales: {
        where:   { transactionType: 'Sale' },
        orderBy: { txDate: 'desc' },
        include: { items: { include: { stock: true } }, stock: true },
      },
    },
  })

  if (!customer) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}><h1>Customer not found</h1></div>
  }

  const totalTx  = customer.sales.length
  const totalQty = customer.sales.reduce((sum, s) => {
    const qty = s.items && s.items.length > 0
      ? s.items.reduce((q, it) => q + (it.quantity || 0), 0)
      : (s.quantity || 0)
    return sum + qty
  }, 0)

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  }

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
      <PrintControls />

      {/* Document */}
      <div style={{ maxWidth: 720, margin: '32px auto', padding: '40px 48px', background: '#fff', boxShadow: '0 2px 24px rgba(0,0,0,.08)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a1a', letterSpacing: -0.5 }}>CUSTOMER PROFILE</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Stock Management System</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Printed {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #7c3aed', marginBottom: 28 }} />

        {/* Customer details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Contact Information</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{customer.customerName}</div>
            {customer.phoneNumber && <div style={{ color: '#4b5563', marginBottom: 4 }}>📞 {customer.phoneNumber}</div>}
            {customer.email       && <div style={{ color: '#4b5563', marginBottom: 4 }}>✉ {customer.email}</div>}
            {customer.address     && <div style={{ color: '#4b5563', marginBottom: 4, whiteSpace: 'pre-wrap' }}>{customer.address}</div>}
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Tax Information</div>
            <table style={{ fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {customer.ntn && (
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 6 }}>NTN Number</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{customer.ntn}</td>
                  </tr>
                )}
                {customer.gstNumber && (
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 6 }}>GST / STRN</td>
                    <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{customer.gstNumber}</td>
                  </tr>
                )}
                {customer.filerStatus && (
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 6 }}>Filer Status</td>
                    <td style={{ fontWeight: 600 }}>{customer.filerStatus}</td>
                  </tr>
                )}
                {!customer.ntn && !customer.gstNumber && !customer.filerStatus && (
                  <tr><td style={{ color: '#9ca3af', fontStyle: 'italic' }}>No tax info recorded</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: 20, background: '#f8f5ff', borderRadius: 8, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{totalTx}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Total Sales</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', fontFamily: 'monospace' }}>{totalQty}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Total Items Sold</div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginBottom: 28 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>Notes</div>
            <div style={{ color: '#4b5563' }}>{customer.notes}</div>
          </div>
        )}

        {/* Transaction history */}
        {customer.sales.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 12 }}>Sales History</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f8f5ff' }}>
                  {['Invoice', 'Date', 'Items', 'Qty'].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', borderBottom: '1px solid #e5e7eb' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customer.sales.map(s => {
                  const its = s.items && s.items.length > 0 ? s.items : (s.stock ? [{ stock: s.stock, quantity: s.quantity }] : [])
                  const names = its.map(it => it.stock?.name || it.stock?.description || it.stock?.ourNo || '?').join(', ')
                  const qty   = its.reduce((q, it) => q + (it.quantity || 0), 0)
                  return (
                    <tr key={s.saleId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: '#7c3aed' }}>{s.invoiceNo || '—'}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(s.txDate)}</td>
                      <td style={{ padding: '8px 10px', fontSize: 12, color: '#374151', maxWidth: 260 }}>{names}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{qty}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
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
