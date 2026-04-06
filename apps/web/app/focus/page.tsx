'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { useApi } from '@/hooks/useApi'
import Link from 'next/link'

const DOMAINS = ['DEV', 'BUSINESS', 'CREATIVE', 'HEALTH', 'TRAVEL', 'LEARNING', 'LIFE']

export default function FocusPage() {
  const api = useApi()
  const router = useRouter()
  const [checkin, setCheckin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    availableHours: 10,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
              ← Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Weekly Focus</h1>
              <p className="text-xs text-gray-400">The One Thing for this week</p>
            </div>
          </div>
          <UserButton />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ) : focusRec ? (
          // Show this week's recommendation
          <div className="space-y-6">
            <div className="bg-blue-600 text-white rounded-2xl p-8">
              <p className="text-blue-200 text-sm font-medium mb-2">YOUR ONE THING THIS WEEK</p>
              <h2 className="text-2xl font-bold mb-4">{focusRec.focus}</h2>
              <p className="text-blue-100 text-sm leading-relaxed">{focusRec.rationale}</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <p className="text-xs font-medium text-gray-500 mb-2">START WITH THIS TODAY</p>
              <p className="text-gray-900 font-medium">{focusRec.firstAction}</p>
            </div>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-500 text-center">
                Check-in complete for this week. Come back next week for a new focus.
              </p>
            </div>
          </div>
        ) : (
          // Show check-in form
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Weekly Check-in</h2>
              <p className="text-sm text-gray-500">3 quick questions to find your one thing.</p>
            </div>

            {/* Available hours */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                How many hours do you have for focused work this week?
                <span className="ml-2 text-blue-600 font-bold">{form.availableHours}h</span>
              </label>
              <input
                type="range" min={1} max={40} value={form.availableHours}
                onChange={e => setForm(f => ({ ...f, availableHours: parseInt(e.target.value) }))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1h</span><span>40h</span>
              </div>
            </div>

            {/* Energy level */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What's your energy level this week?
              </label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setForm(f => ({ ...f, energyLevel: level }))}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                      form.energyLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Drained</span><span>Energized</span>
              </div>
            </div>

            {/* Domain leaning */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Which area are you most drawn to right now? (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map(d => (
                  <button
                    key={d}
                    onClick={() => setForm(f => ({
                      ...f,
                      domainLeaning: f.domainLeaning === d ? '' : d
                    }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      form.domainLeaning === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-blue-600 text-white rounded-xl py-4 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Finding your one thing...' : 'Find My One Thing →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
