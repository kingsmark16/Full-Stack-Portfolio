'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SessionUser = {
  name?: unknown
  email?: unknown
}

type SessionResponse = {
  user?: SessionUser
} | null

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      const response = await fetch('/api/auth/get-session', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        router.replace('/dashboard/sign-in')
        return
      }

      const payload = (await response
        .json()
        .catch(() => null)) as SessionResponse

      if (!payload?.user) {
        router.replace('/dashboard/sign-in')
        return
      }

      if (isMounted) {
        setUser(payload.user)
        setIsLoading(false)
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [router])

  async function handleSignOut() {
    setIsSigningOut(true)

    await fetch('/api/auth/sign-out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: '{}',
    })

    router.replace('/dashboard/sign-in')
    router.refresh()
  }

  if (isLoading) {
    return (
      <main className="owner-dashboard-page" aria-busy="true">
        <p>Loading owner session…</p>
      </main>
    )
  }
  const displayName =
    typeof user?.name === 'string'
      ? user.name
      : typeof user?.email === 'string'
        ? user.email
        : 'owner'

  return (
    <main className="owner-dashboard-page">
      <header>
        <p className="eyebrow">MC.ANGHEL // OWNER CONSOLE</p>
        <h1>Dashboard</h1>
        <p>
          Signed in as <strong>{displayName}</strong>.
        </p>
      </header>

      <section aria-labelledby="dashboard-status-title">
        <h2 id="dashboard-status-title">Access status</h2>
        <p>Owner authentication is active.</p>
      </section>

      <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
        {isSigningOut ? 'Signing out…' : 'Sign out'}
      </button>
    </main>
  )
}
