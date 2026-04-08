'use client'
import { useEffect } from 'react'

const BACKUP_INTERVAL_MS = 30 * 60 * 1000       // 30 minutes

export default function AutoTasks() {
  useEffect(() => {
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

    // Auto-backup every 30 min (first run after 30 min, not immediately)
    const backupTimer = setInterval(autoBackup, BACKUP_INTERVAL_MS)

    return () => {
      clearInterval(backupTimer)
    }
  }, [])

  return null
}
