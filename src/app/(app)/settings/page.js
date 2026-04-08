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

function CategoriesSection() {
  const [rows, setRows] = useState([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [del, setDel] = useState(null)

  const load = () => fetch('/api/categories').then(r => r.json()).then(setRows)
  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const url = editing ? `/api/categories/${editing.typeId}` : '/api/categories'
    const method = editing ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ typeName: name }) })
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
            <button onClick={() => { setEditing(r); setName(r.typeName); setModal(true) }} className="text-sky-600 hover:text-sky-700 text-xs transition-colors">Edit</button>
            <button onClick={() => setDel(r)} className="text-danger/60 hover:text-danger text-xs transition-colors">×</button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-500 text-sm">No categories yet</p>}
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
        onConfirm={async () => { await fetch(`/api/categories/${del.typeId}`, { method: 'DELETE' }); setDel(null); load() }}
        title="Delete Category" message={`Delete "${del?.typeName}"?`} />
    </SettingSection>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Product categories" />
      <CategoriesSection />
    </div>
  )
}
