'use client'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useApi } from '@/hooks/useApi'
import Link from 'next/link'

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

const STATUS_COLORS: Record<string, string> = {
  QUEUED:    'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  ARCHIVED:  'bg-red-100 text-red-600',
}

const QUALITY_LABELS: Record<number, string> = {
  0: 'Blackout',
  1: 'Wrong',
  2: 'Wrong but familiar',
  3: 'Correct (hard)',
  4: 'Correct',
  5: 'Perfect',
}

export default function GoalsPage() {
  const api = useApi()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  const [creating, setCreating] = useState(false)
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

  const isDueForReview = (goal: Goal) => {
    return new Date(goal.nextReviewAt) <= new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Learning Goals</h1>
            <p className="text-xs text-gray-400 mt-0.5">Spaced repetition for what matters</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-700">
              ← Dashboard
            </Link>
            <UserButton />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Add goal form */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Add a learning goal</h2>
          <input
            type="text"
            placeholder="What do you want to learn?"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="Why does this matter to you? (optional)"
            value={why}
            onChange={e => setWhy(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Adding...' : 'Add goal'}
          </button>
        </div>

        {/* Goals list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No learning goals yet</p>
            <p className="text-sm">Add something you want to learn above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => (
              <div
                key={goal.id}
                className={`bg-white border rounded-xl p-5 ${isDueForReview(goal) ? 'border-blue-300' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{goal.title}</h3>
                      {isDueForReview(goal) && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          Due for review
                        </span>
                      )}
                    </div>
                    {goal.why && (
                      <p className="text-xs text-gray-500 mb-2">{goal.why}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[goal.status]}`}>
                        {goal.status}
                      </span>
                      <span>Interval: {goal.interval}d</span>
                      <span>Reviews: {goal.repetitions}</span>
                      <span>Next: {new Date(goal.nextReviewAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-gray-300 hover:text-red-400 text-xs ml-3"
                  >
                    ✕
                  </button>
                </div>

                {/* Review panel */}
                {reviewingId === goal.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">How well did you recall this?</p>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5].map(q => (
                        <button
                          key={q}
                          onClick={() => handleReview(goal.id, q)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            q >= 3
                              ? 'border-green-200 text-green-700 hover:bg-green-50'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {q} — {QUALITY_LABELS[q]}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setReviewingId(null)}
                      className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewingId(goal.id)}
                    className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Review →
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}