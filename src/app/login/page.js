'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setErr('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setErr('Incorrect PIN. Try again.')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/30 mb-4">
            <span className="text-gold text-3xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gold tracking-tight">Stock Management</h1>
          <p className="text-accent-dim text-sm mt-1">Enter your access PIN to continue</p>        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="field-label">Access PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              className="field-input text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
            />
          </div>
          {err && <p className="text-danger text-sm text-center">{err}</p>}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="btn-gold w-full justify-center py-2.5"
          >
            {loading ? 'Verifying…' : 'Enter'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Default PIN: 1234 · Change via ACCESS_PIN env var
        </p>
      </div>
    </div>
  )
}
