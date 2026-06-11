'use client'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:          32,
        height:         32,
        borderRadius:   'var(--radius-md)',
        border:         '0.5px solid var(--border-2)',
        background:     'var(--surface-2)',
        cursor:         'pointer',
        color:          'var(--text-2)',
        transition:     'background 0.15s, color 0.15s',
        flexShrink:     0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-1)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'
      }}
    >
      {theme === 'light' ? (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 1v1M7.5 13v1M1 7.5h1M13 7.5h1M2.9 2.9l.7.7M11.4 11.4l.7.7M2.9 12.1l.7-.7M11.4 3.6l.7-.7M7.5 5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M12 7.4A5 5 0 0 1 6.6 2a5 5 0 1 0 5.4 5.4Z"
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  )
}