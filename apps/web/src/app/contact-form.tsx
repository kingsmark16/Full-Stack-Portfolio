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

    if (!idempotencyKeyRef.current)
      idempotencyKeyRef.current = crypto.randomUUID()
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

  const statusMessage =
    state === 'success'
      ? 'Your message was accepted. Thank you.'
      : state === 'error'
        ? error
        : 'I usually reply by email.'

  return (
    <form
      className="contact-form"
      onSubmit={handleSubmit}
      aria-describedby="contact-status"
    >
      <div className="form-field">
        <label htmlFor="contact-name">Name</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          placeholder="Your name"
          required
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <div className="form-field">
        <label htmlFor="contact-email">Email</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          maxLength={320}
          autoComplete="email"
        />
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Tell me about your project or opportunity."
          required
          maxLength={5000}
          rows={4}
        />
      </div>
      <div className="honeypot" aria-hidden="true">
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
        className="contact-submit"
        type="submit"
        disabled={state === 'submitting'}
      >
        {state === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
      <p
        id="contact-status"
        className={`form-status status-${state}`}
        aria-live="polite"
        role={state === 'error' ? 'alert' : 'status'}
      >
        {statusMessage}
      </p>
    </form>
  )
}
