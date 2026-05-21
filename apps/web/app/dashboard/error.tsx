'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-xs font-mono text-gray-400 mb-2">Error</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Dashboard failed to load</h1>
        <p className="text-sm text-gray-500 mb-6">
          Your ideas are safe. Try refreshing.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:border-gray-300"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}