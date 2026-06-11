'use client'
import React from 'react'
import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { Sidebar } from '@/components/Sidebar'

const DOMAINS = ['DEV', 'BUSINESS', 'CREATIVE', 'HEALTH', 'TRAVEL', 'LEARNING', 'LIFE']

const ENERGY_LABELS: Record<number, string> = {
  1: 'Empty',
  2: 'Low',
  3: 'Steady',
  4: 'Good',
  5: 'Charged',
}

export default function FocusPage() {
  const api = useApi()
  const [checkin, setCheckin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    availableHours: 14,
    energyLevel: 3,
    domainLeaning: '',
  })

  useEffect(() => {
    if (!api.isLoaded || !api.isSignedIn) return
    api.getCheckin()
      .then(data => setCheckin(data))
      .catch(() => setCheckin(null))
      .finally(() => setLoading(false))
  }, [api.isLoaded, api.isSignedIn])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await api.submitCheckin({
        availableHours: form.availableHours,
        energyLevel: form.energyLevel,
        domainLeaning: form.domainLeaning || undefined,
      })
      setCheckin(result)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const focusRec = checkin?.focusRec
    ? typeof checkin.focusRec === 'string'
      ? JSON.parse(checkin.focusRec)
      : checkin.focusRec
    : null

  // How many form fields are filled — drives the step tracker
  const step = form.energyLevel > 0
    ? form.domainLeaning
      ? 3
      : 2
    : 1

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '40px 48px', maxWidth: 620 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 500, letterSpacing: '-0.4px',
          color: 'var(--text-1)', marginBottom: 4,
        }}>
          Weekly Focus
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 32 }}>
          Three questions to find your one thing.
        </p>

        {loading ? (
          <SkeletonFocus />
        ) : focusRec ? (
          <FocusResult rec={focusRec} />
        ) : (
          <CheckInForm
            form={form}
            setForm={setForm}
            step={step}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </main>
    </div>
  )
}

// ─── Step tracker ────────────────────────────────────────────────────────────


function StepTracker({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {[1, 2, 3].map((s, i) => (
        <React.Fragment key={s}>
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: step >= s ? 'var(--accent)' : 'var(--border-2)',
              transition: 'background 0.25s',
            }}
          />
          {i < 2 && (
            <div
              style={{
                flex: 1, height: 1,
                background: step > s ? 'var(--accent)' : 'var(--border)',
                margin: '0 5px',
                transition: 'background 0.25s',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Check-in form ────────────────────────────────────────────────────────────

function CheckInForm({
  form, setForm, step, submitting, onSubmit,
}: {
  form: { availableHours: number; energyLevel: number; domainLeaning: string }
  setForm: React.Dispatch<React.SetStateAction<any>>
  step: number
  submitting: boolean
  onSubmit: () => void
}) {
  return (
    <div>
      <StepTracker step={step} />

      {/* 01 — Capacity */}
      <Section index="01" label="Capacity" question="How many hours do you have for focused work this week?">
        <div style={{
          fontSize: 32, fontWeight: 500, letterSpacing: '-0.8px',
          color: 'var(--text-1)', marginBottom: 14,
        }}>
          {form.availableHours}
          <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-3)', marginLeft: 4 }}>h</span>
        </div>
        <input
          type="range" min={1} max={40}
          value={form.availableHours}
          onChange={e => setForm((f: any) => ({ ...f, availableHours: parseInt(e.target.value) }))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: 'var(--text-3)', marginTop: 8,
        }}>
          <span>1h — almost nothing</span>
          <span>40h — full sprint</span>
        </div>
      </Section>

      {/* 02 — Energy */}
      <Section index="02" label="Energy" question="What's your energy level heading into this week?">
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              onClick={() => setForm((f: any) => ({ ...f, energyLevel: level }))}
              style={{
                flex: 1, padding: '12px 6px',
                borderRadius: 'var(--radius-md)',
                border: form.energyLevel === level ? 'none' : '0.5px solid var(--border)',
                background: form.energyLevel === level ? 'var(--accent-light)' : 'var(--surface-2)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                display: 'block', fontSize: 17, fontWeight: 500,
                color: form.energyLevel === level ? 'var(--accent-text)' : 'var(--text-1)',
                marginBottom: 3,
              }}>
                {level}
              </span>
              <span style={{
                display: 'block', fontSize: 10,
                color: form.energyLevel === level ? 'var(--accent-text)' : 'var(--text-3)',
                opacity: form.energyLevel === level ? 0.85 : 1,
              }}>
                {ENERGY_LABELS[level]}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* 03 — Pull */}
      <Section
        index="03"
        label="Pull"
        question="Which area are you most drawn to right now?"
        optional
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setForm((f: any) => ({
                ...f, domainLeaning: f.domainLeaning === d ? '' : d,
              }))}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: form.domainLeaning === d ? 500 : 400,
                cursor: 'pointer',
                border: form.domainLeaning === d ? 'none' : '0.5px solid var(--border)',
                background: form.domainLeaning === d ? 'var(--accent-light)' : 'var(--surface-2)',
                color: form.domainLeaning === d ? 'var(--accent-text)' : 'var(--text-2)',
                transition: 'all 0.12s',
              }}
            >
              {d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </Section>

      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          width: '100%', padding: '14px 20px',
          borderRadius: 'var(--radius-lg)',
          border: 'none',
          background: submitting ? 'var(--accent-light)' : 'var(--accent)',
          color: submitting ? 'var(--accent-text)' : '#fff',
          fontSize: 14, fontWeight: 500,
          cursor: submitting ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'background 0.15s',
          marginTop: 6,
        }}
      >
        {submitting ? (
          <>
            <SpinnerIcon />
            Finding your one thing...
          </>
        ) : (
          <>
            Find my one thing
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  index, label, question, optional, children,
}: {
  index: string
  label: string
  question: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '22px 24px',
      marginBottom: 14,
    }}>
      <p style={{
        fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
        letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6,
      }}>
        {index} — {label}
        {optional && (
          <span style={{ fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>
            (optional)
          </span>
        )}
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 18, lineHeight: 1.55 }}>
        {question}
      </p>
      {children}
    </div>
  )
}

// ─── Focus result ─────────────────────────────────────────────────────────────

function FocusResult({ rec }: { rec: { focus: string; rationale: string; firstAction: string } }) {
  return (
    <div>
      {/* Hero */}
      <div style={{
        background: 'var(--accent-light)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 28px 24px',
        marginBottom: 14,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.8px',
          textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: 14,
        }}>
          Your one thing this week
        </p>
        {/* Accent bar */}
        <div style={{
          width: 32, height: 3, borderRadius: 2,
          background: 'var(--accent)', marginBottom: 16,
        }} />
        <h2 style={{
          fontSize: 22, fontWeight: 500, color: 'var(--text-1)',
          lineHeight: 1.3, letterSpacing: '-0.4px', marginBottom: 14,
        }}>
          {rec.focus}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.75 }}>
          {rec.rationale}
        </p>
      </div>

      {/* First action */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        marginBottom: 14,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M3 7.5h9M8.5 4l3.5 3.5L8.5 11" stroke="var(--accent-text)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.8px',
          textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8,
        }}>
          Start with this today
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.5 }}>
          {rec.firstAction}
        </p>
      </div>

      {/* Footer note */}
      <div style={{
        background: 'var(--surface-2)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Check-in complete for this week — come back next Monday for a new focus.
        </p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonFocus() {
  return (
    <div>
      {[120, 180, 140].map((h, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            height: h,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 14,
          }}
        />
      ))}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
      <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}