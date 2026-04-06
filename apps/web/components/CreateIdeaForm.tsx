'use client'
import { useState } from 'react'
import { DOMAINS, Domain } from '@idea-vault/types'
import { useApi } from '@/hooks/useApi'

interface Props {
  onCreated: (newIdea?: any) => void
  onIdeaCreated?: (ideaId: string) => void
}

export function CreateIdeaForm({ onCreated, onIdeaCreated }: Props) {
  const api = useApi()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', rawDump: '', domain: 'DEV' as Domain })

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.rawDump.trim()) return
    setLoading(true)
    try {
      const idea = await api.createIdea(form)
      setForm({ title: '', rawDump: '', domain: 'DEV' })
      setOpen(false)
      onCreated(idea)
      onIdeaCreated?.(idea.id)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm font-medium"
      >
        + Dump a new idea
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">New Idea</h3>

      <input
        type="text"
        placeholder="Title"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        placeholder="Brain dump — write whatever is in your head about this idea..."
        value={form.rawDump}
        onChange={e => setForm(f => ({ ...f, rawDump: e.target.value }))}
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      <select
        value={form.domain}
        onChange={e => setForm(f => ({ ...f, domain: e.target.value as Domain }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {DOMAINS.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Idea'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
