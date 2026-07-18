'use client'

import { useRef, useState } from 'react'
import type { FormEvent } from 'react'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

type ProblemResponse = {
  detail?: unknown
}

function getTextValue(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function ContactForm() {
  const [state, setState] = useState<SubmissionState>('idle')
  const [error, setError] = useState('')
  const idempotencyKeyRef = useRef<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      name: getTextValue(formData, 'name'),
      email: getTextValue(formData, 'email'),
      message: getTextValue(formData, 'message'),
      honeypot: getTextValue(formData, 'honeypot'),
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID()
    }

    setState('submitting')
    setError('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null)
        const problem = body as ProblemResponse

        setError(
          typeof problem.detail === 'string'
            ? problem.detail
            : 'The message could not be sent.',
        )
        setState('error')
        return
      }

      form.reset()
      idempotencyKeyRef.current = null
      setState('success')
    } catch {
      setError('The message could not be sent. Please try again.')
      setState('error')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 max-w-2xl space-y-5"
      aria-describedby="contact-status"
    >
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-300"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={320}
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-300"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          maxLength={5000}
          rows={6}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-300"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="contact-honeypot">Website</label>
        <input
          id="contact-honeypot"
          name="honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'submitting' ? 'Sending...' : 'Send message'}
      </button>

      <p
        id="contact-status"
        aria-live="polite"
        className={
          state === 'error' ? 'text-sm text-red-400' : 'text-sm text-zinc-400'
        }
      >
        {state === 'success'
          ? 'Your message was accepted. Thank you.'
          : state === 'error'
            ? error
            : 'I usually reply by email.'}
      </p>
    </form>
  )
}
