'use client'
import { Idea } from '@idea-vault/types'
import { getDomain } from '@/lib/domainConfig'

interface Props {
  idea: Idea
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
  onClick: () => void  // new — opens detail panel
}

const STATUSES = ['PENDING', 'ACTIVE', 'PARKED', 'ARCHIVED'] as const

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  ACTIVE:   { bg: 'var(--status-active-bg)',   color: 'var(--status-active-text)'   },
  PENDING:  { bg: 'var(--status-pending-bg)',  color: 'var(--status-pending-text)'  },
  PARKED:   { bg: 'var(--status-parked-bg)',   color: 'var(--status-parked-text)'   },
  ARCHIVED: { bg: 'var(--status-archived-bg)', color: 'var(--status-archived-text)' },
}

export function IdeaCard({ idea, onDelete, onStatusChange, onClick }: Props) {
  // getDomain returns { accent, bg, text } — all CSS var strings
  const { accent, bg, text } = getDomain(idea.domain)

  const status = STATUS_STYLE[idea.status] ?? STATUS_STYLE.PENDING

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation() // don't open detail panel
    const idx = STATUSES.indexOf(idea.status as any)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    onStatusChange(idea.id, next)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(idea.id)
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--border-2)'
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--border)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Domain accent bar */}
      <div style={{ height: 3, background: accent, flexShrink: 0 }} />

      <div style={{ padding: '14px 15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Domain badge */}
        <span style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          padding: '2px 8px',
          borderRadius: 20,
          background: bg,
          color: text,
          marginBottom: 9,
        }}>
          {idea.domain}
        </span>

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-1)',
          lineHeight: 1.45,
          marginBottom: 7,
        }}>
          {idea.title}
        </h3>

        {/* Raw dump — clamped */}
        <p style={{
          fontSize: 11,
          color: 'var(--text-3)',
          lineHeight: 1.65,
          marginBottom: 10,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}>
          {idea.rawDump}
        </p>

        {/* AI summary or pending */}
        {idea.enrichment ? (
          <div style={{
            borderLeft: `2px solid ${accent}`,
            paddingLeft: 9,
            marginBottom: 10,
          }}>
            <p style={{
              fontSize: 9,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              color: text,
              marginBottom: 3,
            }}>
              AI summary
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.6 }}>
              {idea.enrichment.summary}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#F59E0B',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              AI enrichment in progress...
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '0.5px solid var(--border)',
        padding: '8px 15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          onClick={cycleStatus}
          title="Click to change status"
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '3px 9px',
            borderRadius: 20,
            border: 'none',
            cursor: 'pointer',
            background: status.bg,
            color: status.color,
            transition: 'opacity 0.15s',
          }}
        >
          {idea.status.charAt(0) + idea.status.slice(1).toLowerCase()}
        </button>

        <button
          onClick={handleDelete}
          style={{
            fontSize: 11,
            color: 'var(--text-3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#DC2626')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
            <path d="M2 3.5h9M5 3.5V2.5h3v1M5.5 6v4M7.5 6v4M3 3.5l.5 7h6l.5-7"
              stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Delete
        </button>
      </div>
    </div>
  )
}