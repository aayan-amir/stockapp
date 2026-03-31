'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import Modal from '@/components/Modal'
import ConfirmDialog from '@/components/ConfirmDialog'

function SettingSection({ title, children }) {
  return (
    <div className="card overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-100">
        <h2 className="font-bold text-slate-700">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Currencies ─────────────────────────────────────────────────
function CurrenciesSection() {
  const [rows,    setRows]    = useState([])
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({ currencyCode:'', currencyName:'', exchangeRateToPKR:'' })
  const [saving,  setSaving]  = useState(false)
  const [del,     setDel]     = useState(null)

  const load = () => fetch('/api/currencies').then(r => r.json()).then(setRows)
  useEffect(() => { load() }, [])

  function openNew()     { setEditing(null); setForm({ currencyCode:'', currencyName:'', exchangeRateToPKR:'' }); setModal(true) }
  function openEdit(r)   { setEditing(r); setForm({ currencyCode: r.currencyCode, currencyName: r.currencyName, exchangeRateToPKR: r.exchangeRateToPKR }); setModal(true) }

  async function save() {
    setSaving(true)
    const url    = editing ? `/api/currencies/${editing.rateId}` : '/api/currencies'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); load()
  }

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  return (
    <SettingSection title="Currency Exchange Rates">
      <div className="flex justify-end mb-3">
        <button onClick={openNew} className="btn-ghost btn-sm">+ Add Currency</button>
      </div>
      <table className="data-table">
        <thead><tr><th>Code</th><th>Name</th><th className="text-right">Rate to PKR</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.rateId}>
              <td className="font-mono font-bold text-accent">{r.currencyCode}</td>
              <td>{r.currencyName}</td>
              <td className="text-right font-mono">{r.exchangeRateToPKR}</td>
              <td className="whitespace-nowrap">
                <button onClick={() => openEdit(r)} className="text-sky-400 hover:text-sky-600 text-xs mr-3">Edit</button>
                {r.currencyCode !== 'PKR' && <button onClick={() => setDel(r)} className="text-danger/40 hover:text-danger text-xs">Delete</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Currency' : 'Add Currency'}>
        <div className="space-y-4">
          <div><label className="field-label">Code (e.g. USD)</label><input {...f('currencyCode')} disabled={!!editing} placeholder="USD" /></div>
          <div><label className="field-label">Name</label><input {...f('currencyName')} placeholder="US Dollar" /></div>
          <div><label className="field-label">Rate to PKR</label><input {...f('exchangeRateToPKR')} type="number" step="0.01" placeholder="278.50" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger
        onConfirm={async () => { await fetch(`/api/currencies/${del.rateId}`, { method:'DELETE' }); setDel(null); load() }}
        title="Delete Currency" message={`Delete ${del?.currencyCode}?`} />
    </SettingSection>
  )
}

// ── Tax Rates ───────────────────────────────────────────────────
function TaxRatesSection() {
  const [rows,    setRows]   = useState([])
  const [modal,   setModal]  = useState(false)
  const [editing, setEditing]= useState(null)
  const [form,    setForm]   = useState({ taxName:'', taxRatePercent:'', description:'' })
  const [saving,  setSaving] = useState(false)
  const [del,     setDel]    = useState(null)

  const load = () => fetch('/api/taxrates').then(r => r.json()).then(setRows)
  useEffect(() => { load() }, [])

  function openNew()   { setEditing(null); setForm({ taxName:'', taxRatePercent:'', description:'' }); setModal(true) }
  function openEdit(r) { setEditing(r); setForm({ taxName: r.taxName, taxRatePercent: r.taxRatePercent, description: r.description||'' }); setModal(true) }

  async function save() {
    setSaving(true)
    const url    = editing ? `/api/taxrates/${editing.taxRateId}` : '/api/taxrates'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setModal(false); load()
  }

  const f = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'field-input' })

  return (
    <SettingSection title="Tax Rates">
      <div className="flex justify-end mb-3">
        <button onClick={openNew} className="btn-ghost btn-sm">+ Add Tax Rate</button>
      </div>
      <table className="data-table">
        <thead><tr><th>Name</th><th className="text-right">Rate %</th><th>Description</th><th></th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.taxRateId}>
              <td className="font-semibold">{r.taxName}</td>
              <td className="text-right font-mono text-gold">{r.taxRatePercent}%</td>
              <td className="text-slate-400 text-xs">{r.description || '—'}</td>
              <td className="whitespace-nowrap">
                <button onClick={() => openEdit(r)} className="text-sky-400 hover:text-sky-600 text-xs mr-3">Edit</button>
                <button onClick={() => setDel(r)} className="text-danger/40 hover:text-danger text-xs">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Tax Rate' : 'Add Tax Rate'}>
        <div className="space-y-4">
          <div><label className="field-label">Tax Name</label><input {...f('taxName')} placeholder="Standard GST" /></div>
          <div><label className="field-label">Rate (%)</label><input {...f('taxRatePercent')} type="number" step="0.01" placeholder="18" /></div>
          <div><label className="field-label">Description</label><input {...f('description')} placeholder="Optional description" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-gold">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger
        onConfirm={async () => { await fetch(`/api/taxrates/${del.taxRateId}`, { method:'DELETE' }); setDel(null); load() }}
        title="Delete Tax Rate" message={`Delete "${del?.taxName}"?`} />
    </SettingSection>
  )
}

// ── Categories ──────────────────────────────────────────────────
function CategoriesSection() {
  const [rows,    setRows]   = useState([])
  const [modal,   setModal]  = useState(false)
  const [editing, setEditing]= useState(null)
  const [name,    setName]   = useState('')
  const [saving,  setSaving] = useState(false)
  const [del,     setDel]    = useState(null)

  const load = () => fetch('/api/categories').then(r => r.json()).then(setRows)
  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const url    = editing ? `/api/categories/${editing.typeId}` : '/api/categories'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ typeName: name }) })
    setSaving(false); setModal(false); load()
  }

  return (
    <SettingSection title="Product Categories">
      <div className="flex justify-end mb-3">
        <button onClick={() => { setEditing(null); setName(''); setModal(true) }} className="btn-ghost btn-sm">+ Add Category</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {rows.map(r => (
          <div key={r.typeId} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-sm text-slate-600">{r.typeName}</span>
            <button onClick={() => { setEditing(r); setName(r.typeName); setModal(true) }} className="text-sky-400 hover:text-sky-600 text-xs transition-colors">Edit</button>
            <button onClick={() => setDel(r)} className="text-danger/30 hover:text-danger text-xs transition-colors">×</button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-300 text-sm">No categories yet</p>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div><label className="field-label">Category Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="field-input" placeholder="e.g. Engine Parts" />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()} className="btn-gold">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger
        onConfirm={async () => { await fetch(`/api/categories/${del.typeId}`, { method:'DELETE' }); setDel(null); load() }}
        title="Delete Category" message={`Delete "${del?.typeName}"?`} />
    </SettingSection>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Currencies · Tax Rates · Categories" />
      <CurrenciesSection />
      <TaxRatesSection />
      <CategoriesSection />
    </div>
  )
}
