'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

type AuthErrorResponse = {
  message?: unknown
}

export default function DashboardSignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          rememberMe: true,
        }),
      })

      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => null)) as AuthErrorResponse | null

        const message =
          typeof payload?.message === 'string'
            ? payload.message
            : 'Unable to sign in with those credentials.'

        setErrorMessage(message)
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setErrorMessage('The authentication service is unavailable.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="owner-auth-page">
      <section
        className="owner-auth-card"
        aria-labelledby="owner-sign-in-title"
      >
        <p className="eyebrow">MC.ANGHEL // OWNER ACCESS</p>
        <h1 id="owner-sign-in-title">Sign in</h1>
        <p>Use the private owner credentials to access the dashboard.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="owner-email">Email</label>
          <input
            id="owner-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="owner-password">Password</label>
          <input
            id="owner-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage ? (
            <p role="alert" aria-live="polite">
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
