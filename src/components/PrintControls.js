'use client'

export default function PrintControls({ accentColor = '#7c3aed' }) {
  return (
    <div className="no-print" style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <button
        onClick={() => window.print()}
        style={{ background: accentColor, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
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
  )
}
