'use client'
import { useEffect, useState } from 'react'
import { UserButton } from '@clerk/nextjs'
import { useApi } from '@/hooks/useApi'
import { KanbanBoard } from '@/components/KanbanBoard'
import { CreateIdeaForm } from '@/components/CreateIdeaForm'
import { Sidebar } from '@/components/Sidebar'
import { Idea, Domain, DOMAINS } from '@idea-vault/types'
import { useSocket } from '@/hooks/useSocket'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

export default function DashboardPage() {
  const api = useApi()
  const [ideas, setIdeas]           = useState<Idea[]>([])
  const [loading, setLoading]       = useState(true)
  const [domainFilter, setDomainFilter] = useState<Domain | 'ALL'>('ALL')
  const [dueGoals, setDueGoals]     = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)

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

  useSocket({
    onEnrichmentComplete: (data: { ideaId: string; enrichment: any }) => {
      setIdeas(prev => prev.map(i =>
        i.id === data.ideaId
          ? { ...i, status: 'ENRICHED' as any, enrichment: data.enrichment }
          : i
      ))
    },
    onGoalsDue: (data) => setDueGoals(data.goals),
  })

  const handleCreated = (newIdea?: any) => {
    if (newIdea) setIdeas(prev => [{ ...newIdea, enrichment: null }, ...prev])
    setTimeout(() => fetchIdeas(), 300)
  }

  const handleIdeaCreated = (ideaId: string) => {
    [5000, 15000].forEach(delay =>
      setTimeout(async () => {
        try {
          const idea = await api.getIdea(ideaId)
          if (idea.enrichment)
            setIdeas(prev => prev.map(i =>
              i.id === ideaId ? { ...i, status: 'ENRICHED' as any, enrichment: idea.enrichment } : i
            ))
        } catch {}
      }, delay)
    )
  }

  const handleDelete = async (id: string) => {
    await api.deleteIdea(id)
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const handleStatusChange = async (id: string, status: string) => {
    await api.updateIdea(id, { status })
    setIdeas(prev => prev.map(i =>
      i.id === id ? { ...i, status: status as any } : i
    ))
  }

  const filteredIdeas = domainFilter === 'ALL'
    ? ideas
    : ideas.filter(i => i.domain === domainFilter)

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
      alignItems: 'flex-start',
    }}>
      <Sidebar />

      <main style={{ flex: 1, minWidth: 0, padding: '36px 32px', overflowX: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 500,
              letterSpacing: '-0.4px', color: 'var(--text-1)', marginBottom: 3,
            }}>
              Ideas
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {loading ? '...' : `${ideas.length} idea${ideas.length !== 1 ? 's' : ''} · dump raw, AI enriches`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <UserButton />
          </div>
        </div>

        {/* Due goals banner */}
        {dueGoals.length > 0 && (
          <div style={{
            background: 'rgba(5,150,105,0.08)',
            border: '0.5px solid var(--border-2)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: 'var(--em)', flexShrink: 0,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                  {dueGoals.length} goal{dueGoals.length > 1 ? 's' : ''} due for review
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {dueGoals.map(g => g.title).join(', ')}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/goals" style={{
                fontSize: 12, fontWeight: 500,
                background: 'var(--em)', color: '#fff',
                padding: '5px 12px', borderRadius: 6,
                textDecoration: 'none',
              }}>
                Review now
              </Link>
              <button onClick={() => setDueGoals([])} style={{
                fontSize: 11, color: 'var(--text-3)',
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Domain filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {(['ALL', ...DOMAINS] as const).map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11,
                fontWeight: domainFilter === d ? 500 : 400,
                cursor: 'pointer',
                border: `0.5px solid ${domainFilter === d ? 'var(--em)' : 'var(--border)'}`,
                background: domainFilter === d ? 'var(--em)' : 'rgba(255,255,255,0.4)',
                color: domainFilter === d ? '#fff' : 'var(--text-2)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.15s',
              }}
            >
              {d === 'ALL' ? 'All' : d.charAt(0) + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Capture trigger */}
        {!createOpen && (
          <button
            onClick={() => setCreateOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', maxWidth: 420,
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(8px)',
              border: '0.5px dashed var(--border-2)',
              borderRadius: 12, padding: '12px 16px',
              cursor: 'pointer', marginBottom: 24,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(209,250,229,0.3)'
              e.currentTarget.style.borderColor = 'var(--em)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.4)'
              e.currentTarget.style.borderColor = 'var(--border-2)'
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'var(--em-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="var(--em)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Capture an idea</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Dump whatever's in your head</p>
            </div>
          </button>
        )}

        {createOpen && (
          <div style={{ marginBottom: 24, maxWidth: 520 }}>
            <CreateIdeaForm
              onCreated={(idea) => { handleCreated(idea); setCreateOpen(false) }}
              onIdeaCreated={handleIdeaCreated}
              onCancel={() => setCreateOpen(false)}
            />
          </div>
        )}

        {/* Kanban board */}
        <KanbanBoard
          ideas={filteredIdeas}
          loading={loading}
          onCardClick={setSelectedIdea}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onCaptureClick={() => setCreateOpen(true)}
        />
      </main>

    </div>
  )
}