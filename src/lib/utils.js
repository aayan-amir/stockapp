export const fmt = (n, d = 2) =>
  n == null ? '—' : Number(n).toLocaleString('en-PK', { minimumFractionDigits: d, maximumFractionDigits: d })

export const fmtDate = d =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const calcTotal = ({ qty = 0, unitFCY = 0, exRate = 1, taxRate = 0, freight = 0, other = 0 }) => {
  const sub = qty * unitFCY * (exRate || 1)
  const tax = sub * taxRate / 100
  return { sub, tax, total: sub + tax + freight + other }
}

export const today = () => new Date().toISOString().slice(0, 10)
