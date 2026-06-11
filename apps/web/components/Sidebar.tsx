'use client'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

const NAV = [
  {
    href: '/dashboard', label: 'Ideas', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a3.5 3.5 0 0 1 2.5 5.96V10a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V7.46A3.5 3.5 0 0 1 8 1.5ZM6 11.5h4M6.5 13h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    )
  },
  {
    href: '/focus', label: 'Weekly Focus', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2" /></svg>
    )
  },
  {
    href: '/goals', label: 'Learning Goals', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 12 8 4l3.5 4.5L11 7l3 5H2Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    )
  },
  {
    href: '/graph', label: 'Idea Graph', icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" /><circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" /><circle cx="13" cy="12" r="2" stroke="currentColor" strokeWidth="1.2" /><path d="M5 8h3m0 0v-3l3-1m-3 4v3l3 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    )
  },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      // background: 'var(--surface)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'var(--surface-card)',
      backdropFilter: 'blur(16px)',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '0.5px solid var(--border)' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
          IdeaVault
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.1px' }}>
          Personal Clarity OS
        </p>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px 0', flex: 1 }}>
        <p style={{
          fontSize: 10, fontWeight: 500, color: 'var(--text-3)',
          letterSpacing: '0.7px', textTransform: 'uppercase',
          padding: '10px 8px 6px',
        }}>
          Workspace
        </p>
        {NAV.map(({ href, label, icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 2,
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--accent-text)' : 'var(--text-2)',
                background: active ? 'var(--accent-light)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <span style={{ opacity: active ? 1 : 0.65, color: 'inherit', display: 'flex' }}>
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '0.5px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserButton />
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Account</p>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  )
}