'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/',          label: 'Dashboard',   icon: '◈' },
  { href: '/stock',     label: 'Stock',        icon: '▦' },
  { href: '/purchases', label: 'Purchases',    icon: '↓' },
  { href: '/sales',     label: 'Sales',        icon: '↑' },
  { href: '/ledger',    label: 'Ledger',       icon: '≡' },
  { href: '/customers', label: 'Customers',    icon: '◎' },
  { href: '/settings',  label: 'Settings',     icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-52 shrink-0 bg-[#070e1c] border-r border-white/5 flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/5">
        <div className="text-gold font-bold text-lg leading-tight tracking-tight">STOCK</div>
        <div className="text-accent/40 text-[10px] tracking-[0.35em] uppercase mt-0.5 font-mono">Management v3</div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-gold/10 text-gold font-semibold border border-gold/20'
                  : 'text-blue-200/50 hover:text-blue-100 hover:bg-white/5'
              }`}
            >
              <span className="text-base w-5 text-center shrink-0">{icon}</span>
              <span>{label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/30 hover:text-danger hover:bg-danger/10 transition-all"
        >
          <span className="text-base w-5 text-center">⇥</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
