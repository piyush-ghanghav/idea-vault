'use client'
import { useEffect, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { Sidebar } from '@/components/Sidebar'

interface Goal {
  id: string
  title: string
  why: string | null
  status: string
  interval: number
  repetitions: number
  easeFactor: number
  nextReviewAt: string
  lastReviewedAt: string | null
  createdAt: string
}

const QUALITY_LABELS: Record<number, string> = {
  0: 'Blackout',
  1: 'Wrong',
  2: 'Familiar',
  3: 'Hard recall',
  4: 'Correct',
  5: 'Perfect',
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  QUEUED:    { bg: 'var(--surface-2)',   color: 'var(--text-2)'    },
  ACTIVE:    { bg: 'var(--accent-light)', color: 'var(--accent-text)' },
  COMPLETED: { bg: '#edfaf3',            color: '#1a6b42'          },
  ARCHIVED:  { bg: 'var(--surface-2)',   color: 'var(--text-3)'    },
}

export default function GoalsPage() {
  const api = useApi()
  const [goals, setGoals]         = useState<Goal[]>([])
  const [loading, setLoading]     = useState(true)
  const [title, setTitle]         = useState('')
  const [why, setWhy]             = useState('')
  const [creating, setCreating]   = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const fetchGoals = async () => {
    try {
      const res = await api.getGoals()
      setGoals(res.goals)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!api.isLoaded || !api.isSignedIn) return
    fetchGoals()
  }, [api.isLoaded, api.isSignedIn])

  const handleCreate = async () => {
    if (!title.trim()) return
    setCreating(true)
    try {
      const res = await api.createGoal({ title: title.trim(), why: why.trim() || undefined })
      setGoals(prev => [res.goal, ...prev])
      setTitle('')
      setWhy('')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleReview = async (id: string, quality: number) => {
    try {
      const res = await api.reviewGoal(id, quality)
      setGoals(prev => prev.map(g => g.id === id ? res.goal : g))
      setReviewingId(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteGoal(id)
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const isDue = (goal: Goal) => new Date(goal.nextReviewAt) <= new Date()

  const overdueDays = (goal: Goal) => {
    const diff = Date.now() - new Date(goal.nextReviewAt).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const dueGoals = goals.filter(isDue)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />

      <main style={{ flex: 1, padding: '40px 44px', maxWidth: 680 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 500, letterSpacing: '-0.4px',
          color: 'var(--text-1)', marginBottom: 4,
        }}>
          Learning Goals
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
          Spaced repetition for what actually matters.
        </p>

        {/* Add goal form */}
        <AddGoalForm
          title={title}
          why={why}
          creating={creating}
          onTitleChange={setTitle}
          onWhyChange={setWhy}
          onSubmit={handleCreate}
        />

        {/* Due goals banner */}
        {!loading && dueGoals.length > 0 && (
          <div style={{
            background: '#fef9ee',
            border: '0.5px solid #f5d87a',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#f0a020', flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#92600a' }}>
                {dueGoals.length} goal{dueGoals.length > 1 ? 's' : ''} due for review
              </p>
              <p style={{ fontSize: 12, color: '#b07820', marginTop: 2 }}>
                Your SM-2 schedule says now is the right time
              </p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <SkeletonGoals />
        ) : goals.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {goals.map(goal => (
              <GoalCard
                key={goal.id}
                goal={goal}
                due={isDue(goal)}
                overdueDays={overdueDays(goal)}
                reviewing={reviewingId === goal.id}
                onReview={handleReview}
                onStartReview={() => setReviewingId(goal.id)}
                onCancelReview={() => setReviewingId(null)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ─── Add goal form ────────────────────────────────────────────────────────────

function AddGoalForm({
  title, why, creating,
  onTitleChange, onWhyChange, onSubmit,
}: {
  title: string
  why: string
  creating: boolean
  onTitleChange: (v: string) => void
  onWhyChange: (v: string) => void
  onSubmit: () => void
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 22px',
      marginBottom: 24,
    }}>
      <input
        type="text"
        placeholder="What do you want to learn?"
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        style={{
          width: '100%', border: 'none', background: 'transparent',
          fontSize: 15, fontWeight: 500, color: 'var(--text-1)',
          outline: 'none', paddingBottom: 10,
          borderBottom: '0.5px solid var(--border)', marginBottom: 12,
        }}
      />
      <input
        type="text"
        placeholder="Why does this matter to you? (optional)"
        value={why}
        onChange={e => onWhyChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        style={{
          width: '100%', border: 'none', background: 'transparent',
          fontSize: 13, color: 'var(--text-2)', outline: 'none',
          marginBottom: 14,
        }}
      />
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10, borderTop: '0.5px solid var(--border)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>↵ Enter to add</span>
        <button
          onClick={onSubmit}
          disabled={creating || !title.trim()}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 12, fontWeight: 500,
            cursor: creating || !title.trim() ? 'default' : 'pointer',
            opacity: creating || !title.trim() ? 0.45 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {creating ? 'Adding...' : 'Add goal'}
        </button>
      </div>
    </div>
  )
}

// ─── Goal card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal, due, overdueDays, reviewing,
  onReview, onStartReview, onCancelReview, onDelete,
}: {
  goal: Goal
  due: boolean
  overdueDays: number
  reviewing: boolean
  onReview: (id: string, q: number) => void
  onStartReview: () => void
  onCancelReview: () => void
  onDelete: (id: string) => void
}) {
  const statusStyle = STATUS_STYLE[goal.status] ?? STATUS_STYLE.QUEUED
  const nextDate = new Date(goal.nextReviewAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })

  return (
    <div style={{
      background: 'var(--surface)',
      border: `0.5px solid ${due ? '#f5d87a' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      {/* Card body */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.4 }}>
                {goal.title}
              </h3>
              {due && (
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  background: '#fef9ee', color: '#92600a',
                  border: '0.5px solid #f5d87a',
                  padding: '2px 9px', borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  Due now
                </span>
              )}
            </div>
            {/* Why */}
            {goal.why && (
              <p style={{
                fontSize: 12, color: 'var(--text-3)',
                lineHeight: 1.6, marginBottom: 10,
              }}>
                {goal.why}
              </p>
            )}
            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 500,
                padding: '2px 9px', borderRadius: 20,
                background: statusStyle.bg, color: statusStyle.color,
              }}>
                {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
              </span>
              <span style={{ fontSize: 11, color: 'var(--border-2)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Interval {goal.interval}d
              </span>
              <span style={{ fontSize: 11, color: 'var(--border-2)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {goal.repetitions} review{goal.repetitions !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Delete */}
          <button
            onClick={() => onDelete(goal.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', padding: 2, marginLeft: 10,
              display: 'flex', alignItems: 'center',
              transition: 'color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e24b4a')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Review panel — expanded */}
      {reviewing ? (
        <div style={{
          borderTop: '0.5px solid var(--border)',
          background: 'var(--surface-2)',
          padding: '18px 18px',
        }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 14 }}>
            How well did you recall this?
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 7, marginBottom: 14,
          }}>
            {([0, 1, 2, 3, 4, 5] as const).map(q => {
              const fail = q < 3
              return (
                <button
                  key={q}
                  onClick={() => onReview(goal.id, q)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-md)',
                    border: `0.5px solid ${fail ? '#fecaca' : '#a7f3d0'}`,
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = fail ? '#fef2f2' : '#edfaf3'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'
                  }}
                >
                  <span style={{
                    display: 'block', fontSize: 16, fontWeight: 500,
                    color: fail ? '#b91c1c' : '#1a6b42', marginBottom: 3,
                  }}>
                    {q}
                  </span>
                  <span style={{
                    display: 'block', fontSize: 10,
                    color: fail ? '#dc6b6b' : '#4a9b71',
                  }}>
                    {QUALITY_LABELS[q]}
                  </span>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
              Higher = longer until next review
            </span>
            <button
              onClick={onCancelReview}
              style={{
                fontSize: 12, color: 'var(--text-3)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Footer — collapsed */
        <div style={{
          borderTop: '0.5px solid var(--border)',
          padding: '10px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={onStartReview}
            style={{
              fontSize: 12, fontWeight: 500,
              padding: '5px 14px', borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
              background: due ? '#fef9ee' : 'var(--accent-light)',
              color: due ? '#92600a' : 'var(--accent-text)',
              transition: 'opacity 0.15s',
            }}
          >
            {due ? 'Review now' : 'Review'}
          </button>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {due
              ? overdueDays > 0
                ? `Overdue by ${overdueDays}d`
                : 'Due today'
              : `Next: ${nextDate}`}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGoals() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[80, 100, 80].map((h, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{
            height: h,
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3v12M3 9h12" stroke="var(--text-3)" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
        No learning goals yet
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
        Add something you want to learn above
      </p>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 3.5h9M5 3.5V2.5h3v1M5.5 6v4M7.5 6v4M3 3.5l.5 7h6l.5-7"
        stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}