'use client'

import { useRouter } from 'next/router'

export function RetryButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.reload()}
      className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-200 transition hover:border-zinc-400"
    >
      Try Again
    </button>
  )
}
