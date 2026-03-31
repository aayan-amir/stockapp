'use client'
import { useEffect } from 'react'

const RATE_REFRESH_MS  = 24 * 60 * 60 * 1000  // 24 hours
const BACKUP_INTERVAL_MS = 30 * 60 * 1000       // 30 minutes

export default function AutoTasks() {
  useEffect(() => {
    async function refreshRates() {
      try { await fetch('/api/currencies/refresh', { method: 'POST' }) } catch (_) {}
    }

    async function autoBackup() {
      try {
        const res  = await fetch('/api/backup')
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = document.createElement('a')
        const date = new Date().toISOString().slice(0, 10)
        a.href     = url
        a.download = `stockapp-backup-${date}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (_) {}
    }

    // Refresh rates once on mount, then every 24 h
    refreshRates()
    const rateTimer = setInterval(refreshRates, RATE_REFRESH_MS)

    // Auto-backup every 30 min (first run after 30 min, not immediately)
    const backupTimer = setInterval(autoBackup, BACKUP_INTERVAL_MS)

    return () => {
      clearInterval(rateTimer)
      clearInterval(backupTimer)
    }
  }, [])

  return null
}
