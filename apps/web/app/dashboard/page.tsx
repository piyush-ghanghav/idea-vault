'use client'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useApi } from '@/hooks/useApi'
import { IdeaCard } from '@/components/IdeaCard'
import { CreateIdeaForm } from '@/components/CreateIdeaForm'
import { Idea, Domain, DOMAINS } from '@idea-vault/types'
import { useSocket } from '@/hooks/useSocket'
import Link from 'next/dist/client/link'

export default function DashboardPage() {
  const api = useApi()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [domainFilter, setDomainFilter] = useState<Domain | 'ALL'>('ALL')

  const fetchIdeas = async () => {
    try {
      const res = await api.getIdeas(
        domainFilter !== 'ALL' ? { domain: domainFilter } : undefined
      )
      setIdeas(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!api.isLoaded || !api.isSignedIn) return
    fetchIdeas()
  }, [domainFilter, api.isLoaded, api.isSignedIn])

  // Live enrichment updates via Socket.io
  const handleEnrichmentComplete = (data: { ideaId: string; enrichment: any }) => {
    console.log('[Dashboard] Live enrichment update for:', data.ideaId)
    setIdeas(prev => prev.map(idea =>
      idea.id === data.ideaId
        ? { ...idea, status: 'ENRICHED' as any, enrichment: data.enrichment }
        : idea
    ))
  }

  useSocket(handleEnrichmentComplete)

  // Called after idea is created
  const handleCreated = (newIdea?: any) => {
    if (newIdea) {
      setIdeas(prev => [{ ...newIdea, enrichment: null }, ...prev])
    }
    setTimeout(() => fetchIdeas(), 300)
  }

  // Fallback polling if socket misses event
  const handleIdeaCreated = (ideaId: string) => {
    [5000, 15000].forEach(delay => {
      setTimeout(async () => {
        try {
          const idea = await api.getIdea(ideaId)
          if (idea.enrichment) {
            setIdeas(prev => prev.map(i =>
              i.id === ideaId
                ? { ...i, status: 'ENRICHED' as any, enrichment: idea.enrichment }
                : i
            ))
          }
        } catch (err) {

        }
      }, delay)
    })
  }

  const handleDelete = async (id: string) => {
    await api.deleteIdea(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.updateIdea(id, { status })
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, status: status as any } : i))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">IdeaVault</h1>
            <p className="text-xs text-gray-400 mt-0.5">Your personal clarity OS</p>
          </div>

          <Link
            href="/focus"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-3 py-1 rounded-full"
          >
            Weekly Focus →
          </Link>

          <Link
            href="/goals"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-3 py-1 rounded-full"
          >
            Learning Goals →
          </Link>
          <Link
            href="/graph"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 px-3 py-1 rounded-full"
          >
            Idea Graph →
          </Link>
          <UserButton />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setDomainFilter('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${domainFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
          >
            All
          </button>
          {DOMAINS.map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${domainFilter === d
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <CreateIdeaForm
            onCreated={handleCreated}
            onIdeaCreated={handleIdeaCreated}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">No ideas yet</p>
            <p className="text-sm">Dump your first idea above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ideas.map(idea => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}