'use client'
import { useState, useRef, useEffect } from 'react'
import { DOMAINS, Domain } from '@idea-vault/types'
import { useApi } from '@/hooks/useApi'

interface Props {
  onCreated: (newIdea?: any) => void
  onIdeaCreated?: (ideaId: string) => void
  onCancel: () => void
}

const DOMAIN_COLORS: Record<string, { accent: string; bg: string; text: string }> = {
  DEV:      { accent: '#5b5bd6', bg: '#ededfc', text: '#3d3d9e' },
  DESIGN:   { accent: '#1d9e75', bg: '#eaf8f3', text: '#0f6e56' },
  BUSINESS: { accent: '#d85a30', bg: '#fef0ed', text: '#9b3a25' },
  PERSONAL: { accent: '#d4537e', bg: '#fbeaf0', text: '#993556' },
  RESEARCH: { accent: '#ba7517', bg: '#faeeda', text: '#854f0b' },
}

export function CreateIdeaForm({ onCreated, onIdeaCreated, onCancel }: Props) {
  const api = useApi()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', rawDump: '', domain: 'DEV' as Domain })
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  const domainColor = DOMAIN_COLORS[form.domain] ?? DOMAIN_COLORS.DEV

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.rawDump.trim()) return
    setLoading(true)
    try {
      const idea = await api.createIdea(form)
      setForm({ title: '', rawDump: '', domain: 'DEV' })
      onCreated(idea)
      onIdeaCreated?.(idea.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Domain color accent bar */}
      <div style={{ height: 3, background: domainColor.accent, transition: 'background 0.2s' }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Domain selector — pill style */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {DOMAINS.map(d => {
            const c = DOMAIN_COLORS[d] ?? DOMAIN_COLORS.DEV
            const active = form.domain === d
            return (
              <button
                key={d}
                onClick={() => setForm(f => ({ ...f, domain: d }))}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  cursor: 'pointer',
                  border: active ? 'none' : '0.5px solid var(--border)',
                  background: active ? c.bg : 'transparent',
                  color: active ? c.text : 'var(--text-3)',
                  transition: 'all 0.12s',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          type="text"
          placeholder="What's the idea?"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--text-1)',
            outline: 'none',
            marginBottom: 10,
            padding: 0,
          }}
        />

        {/* Raw dump */}
        <textarea
          placeholder="Brain dump — write everything you know, think, or want to explore..."
          value={form.rawDump}
          onChange={e => setForm(f => ({ ...f, rawDump: e.target.value }))}
          rows={4}
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 13,
            color: 'var(--text-2)',
            outline: 'none',
            resize: 'none',
            lineHeight: 1.7,
            padding: 0,
            marginBottom: 16,
          }}
        />

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
            ⌘↵ to save · Esc to cancel
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '0.5px solid var(--border)',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--text-2)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.title.trim() || !form.rawDump.trim()}
              style={{
                padding: '7px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: loading ? 'var(--accent-light)' : 'var(--accent)',
                color: loading ? 'var(--accent-text)' : '#fff',
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? 'default' : 'pointer',
                opacity: (!form.title.trim() || !form.rawDump.trim()) ? 0.45 : 1,
                transition: 'opacity 0.15s, background 0.15s',
              }}
            >
              {loading ? 'Saving...' : 'Save idea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}