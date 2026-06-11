'use client'

import { useEffect, ReactNode, useState } from 'react'
import { Idea } from '@idea-vault/types'

interface Props {
  idea: Idea
  onClose: () => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: string) => void
}

const STATUSES = ['PENDING', 'ACTIVE', 'PARKED', 'ARCHIVED'] as const

export function IdeaFocusOverlay({
  idea,
  onClose,
  onDelete,
  onStatusChange,
}: Props) {

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const cycleStatus = () => {
    const next =
      STATUSES[
      (STATUSES.indexOf(idea.status as (typeof STATUSES)[number]) + 1) %
      STATUSES.length
      ]

    onStatusChange(idea.id, next)
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-xl"
    >
      <div className="flex h-auto max-h-[88vh] w-full max-w-[860px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[0_32px_80px_rgba(0,0,0,0.25)]">
        {/* LEFT */}
        <div className="themed-scrollbar flex flex-[55] flex-col gap-5 overflow-y-auto border-r border-[var(--border)] p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--em)]" />

                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-2)]">
                  {idea.domain}
                </span>
              </div>

              <h1 className="font-display mb-2 text-[26px] font-medium leading-[1.15] tracking-[-0.8px] text-[var(--text-1)]">
                {idea.title}
              </h1>

              <p className="font-mono text-[11px] text-[var(--text-3)]">
                {new Date(idea.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-3)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-1)]"
            >
              ✕
            </button>
          </div>

          <Card className="">
            <SectionTitle>Raw Capture</SectionTitle>

            <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--text-2)]">
              {idea.rawDump}
            </p>
          </Card>

          <Card>
            <SectionTitle>Actions</SectionTitle>

            <div className="flex gap-2">
              <button
                onClick={cycleStatus}
                className=" flex-1 rounded-[var(--radius-md)] border border-[var(--border)] 
                bg-[var(--surface-2)] px-3 py-2 text-sm font-medium text-[var(--text-1)] hover:bg-[var(--surface)]"
              >
                Change Status
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/5 text-red-500 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10"
                aria-label="Delete idea"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
              </button>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="themed-scrollbar flex flex-[45] flex-col gap-3 overflow-y-auto bg-[var(--surface-2)] p-6">
          <Card>
            <SectionTitle>AI Insight</SectionTitle>

            <p className="text-[13px] leading-7 text-[var(--text-2)]">
              {idea.enrichment?.summary ?? (
                <span className="italic text-[var(--text-3)]">
                  Enrichment in progress...
                </span>
              )}
            </p>
          </Card>
        </div>

        {
          showDeleteConfirm && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div
                className="w-full max-w-smrounded-[var(--radius-xl)]border border-[var(--border)]bg-[var(--surface)]p-6shadow-xl
                "
              >
                <h3 className="text-lg font-semibold text-[var(--text-1)]">
                  Delete Idea?
                </h3>

                <p className="mt-2 text-sm text-[var(--text-3)]">
                  This action cannot be undone.
                </p>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className=" rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-2)] hover:bg-[var(--surface-2)]
                    ">
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      onDelete(idea.id)
                      onClose()
                    }}
                    className=" rounded-[var(--radius-md)] bg-red-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90
                    ">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div>
    </div>

  )
}



function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-[18px] py-4 ${className}`}
    >
      {children}
    </div>
  )
}


function SectionTitle({
  children,
}: {
  children: ReactNode
}) {
  return (
    <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--text-3)]">
      {children}
    </p>
  )
}