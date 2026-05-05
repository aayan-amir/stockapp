'use client'

export default function InvoicePrint({ sale }) {
  const isPurchase  = sale.transactionType === 'Purchase'
  const docTitle    = isPurchase ? 'PURCHASE ORDER' : 'INVOICE'
  const accent      = isPurchase ? '#0369a1' : '#7c3aed'
  const bg          = isPurchase ? '#f0f9ff' : '#f8f5ff'
  const lineItems   = sale.items?.length > 0 ? sale.items : sale.stock ? [{ stock: sale.stock, quantity: sale.quantity }] : []
  const totalQty    = lineItems.reduce((s, it) => s + (it.quantity || 0), 0)
  const dateStr     = sale.txDate
    ? new Date(sale.txDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'
  const c = sale.customer

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 13, color: '#1a1a1a', padding: '40px 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{docTitle}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Stock Management System</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: accent, fontFamily: 'monospace' }}>{sale.invoiceNo || '—'}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ borderTop: `2px solid ${accent}`, marginBottom: 28 }} />

      {/* Bill-to / Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 6 }}>
            {isPurchase ? 'Supplier' : 'Bill To'}
          </div>
          {isPurchase ? (
            sale.supplierName
              ? <div style={{ fontWeight: 700, fontSize: 15 }}>{sale.supplierName}</div>
              : <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No supplier recorded</div>
          ) : c ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.customerName}</div>
              {c.address     && <div style={{ color: '#6b7280', marginTop: 2 }}>{c.address}</div>}
              {c.phoneNumber && <div style={{ color: '#6b7280', marginTop: 1 }}>📞 {c.phoneNumber}</div>}
              {c.email       && <div style={{ color: '#6b7280', marginTop: 1 }}>✉ {c.email}</div>}
              {c.ntn         && <div style={{ color: '#6b7280', marginTop: 1 }}>NTN: <b>{c.ntn}</b></div>}
              {c.gstNumber   && <div style={{ color: '#6b7280', marginTop: 1 }}>GST: <b>{c.gstNumber}</b></div>}
            </>
          ) : (
            <div style={{ color: '#6b7280', fontStyle: 'italic' }}>Walk-in Customer</div>
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
              {!isPurchase && c?.filerStatus && (
                <tr>
                  <td style={{ color: '#6b7280', paddingRight: 12, paddingBottom: 4 }}>Filer Status</td>
                  <td>{c.filerStatus}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: bg }}>
            {['#', 'Our No.', 'Description', 'Qty'].map((h, i) => (
              <th key={h} style={{ textAlign: i === 3 ? 'right' : 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: accent, borderBottom: '1px solid #e5e7eb' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lineItems.map((it, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{idx + 1}</td>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{it.stock?.ourNo || '—'}</td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 500 }}>{it.stock?.name || it.stock?.description || 'Unnamed item'}</div>
                {it.stock?.oemNo && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>OEM: {it.stock.oemNo}</div>}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{it.quantity}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: bg }}>
            <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: accent }}>Total Quantity</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: accent }}>{totalQty}</td>
          </tr>
        </tfoot>
      </table>

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
  )
}
