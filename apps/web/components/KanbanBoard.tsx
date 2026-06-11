'use client'

import { useState } from 'react'
import { Idea } from '@idea-vault/types'
import { IdeaFocusOverlay } from './IdeaFocusOverlay'

const COLUMNS = [
  { status: 'ENRICHED', label: 'Enriched ', dot: '#af9c9c' },
  { status: 'PENDING', label: 'Pending', dot: '#F59E0B' },
  { status: 'ACTIVE', label: 'Active', dot: '#059669' },
  // { status: 'PARKED', label: 'Parked', dot: '#D97706' },
  { status: 'ARCHIVED', label: 'Archived', dot: '#9CA3AF' },
] as const
// Replace the DOMAIN_CARD record — add all missing domains:


interface Props {
  ideas: Idea[]
  loading: boolean
  onCardClick: (idea: Idea) => void
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
  onCaptureClick: () => void
}

export function KanbanBoard({
  ideas,
  loading,
  onDelete,
  onStatusChange,
  onCaptureClick,
}: Props) {
  const [selectedIdea, setSelectedIdea] =
    useState<Idea | null>(null)

  if (loading) return <KanbanSkeleton />

  return (
    <>
      <div className="grid grid-cols-4 items-start gap-3">
        {COLUMNS.map((col) => {
          const colIdeas = ideas.filter(
            (i) => i.status === col.status
          )

          return (
            <div
              key={col.status}
              className="
                rounded-[var(--radius-lg)]
                border border-[var(--border)]
                bg-[var(--surface-2)]
                p-3
              "
            >
              <div className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--em)]" />

                  <span className="text-[11px] font-medium text-[var(--text-2)]">
                    {col.label}
                  </span>
                </div>

                <span
                  className="
                    rounded-full
                    bg-[var(--surface)]
                    px-2 py-0.5
                    text-[10px]
                    text-[var(--text-3)]
                  "
                >
                  {colIdeas.length}
                </span>
              </div>

              {colIdeas.map((idea) => (
                <KanbanCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => setSelectedIdea(idea)}
                  onDelete={onDelete}
                />
              ))}

              {colIdeas.length === 0 && (
                <div className="px-2 py-6 text-center">
                  <p className="text-[11px] text-[var(--text-3)]">
                    No ideas here
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedIdea && (
        <IdeaFocusOverlay
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onDelete={onDelete}
          onStatusChange={(id, status) => {
            onStatusChange(id, status)

            setSelectedIdea((prev) =>
              prev?.id === id
                ? { ...prev, status: status as any }
                : prev
            )
          }}
        />
      )}
    </>
  )
}

function KanbanCard({
  idea,
  onClick,
  onDelete,
}: {
  idea: Idea
  onClick: () => void
  onDelete: (id: string) => void
}) {
  const enriched = !!idea.enrichment

  const date = new Date(idea.createdAt).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  )

  const handleDelete = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation()
    onDelete(idea.id)
  }

  return (
    <div
      onClick={onClick}
      className="
        mb-2
        cursor-pointer
        rounded-xl
        border border-[var(--border)]
        bg-[var(--surface)]
        p-3
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-[var(--border-2)]
        hover:shadow-md
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--em)]" />

          <span className="font-mono text-[9px] font-semibold uppercase tracking-[1px] text-[var(--text-2)]">
            {idea.domain}
          </span>
        </div>

        <span className="text-[10px] text-[var(--text-3)]">
          {date}
        </span>
      </div>

      <p className="mb-2 text-sm font-medium text-[var(--text-1)]">
        {idea.title}
      </p>

      <p className="mb-3 line-clamp-2 text-xs leading-5 text-[var(--text-3)]">
        {idea.rawDump}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 w-1.5 rounded-full ${enriched
                ? 'bg-[var(--em)]'
                : 'bg-[var(--text-3)]'
              }`}
          />

          <span className="text-[10px] text-[var(--text-3)]">
            {enriched
              ? 'AI enriched'
              : 'Enriching...'}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className="
            text-[10px]
            text-[var(--text-3)]
            transition-colors
            hover:text-red-500
          "
        >
          delete
        </button>
      </div>
    </div>
  )
}

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[2, 3, 1, 0].map((count, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-3"
        >
          <div className="skeleton-shimmer mb-4 h-3 w-[55%] rounded-md bg-[var(--border)]" />

          {Array.from({ length: count }).map((_, j) => (
            <div
              key={j}
              className="skeleton-shimmer mb-2 h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            />
          ))}
        </div>
      ))}
    </div>
  )
}