const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 25 * 60_000, 125 * 60_000] as const

export const CONTACT_EMAIL_MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1
export const CONTACT_EMAIL_LEASE_DURATION_MS = 60_000
export const CONTACT_EMAIL_SEND_TIMEOUT_MS = 45_000
export const CONTACT_EMAIL_POLL_INTERVAL_MS = 15_000
export const CONTACT_EMAIL_MAX_EVENTS_PER_POLL = 10

export function retryDelayForAttempt(attemptCount: number): number | null {
  if (!Number.isInteger(attemptCount) || attemptCount < 1) {
    throw new Error('attemptCount must be a positive integer')
  }

  return RETRY_DELAYS_MS[attemptCount - 1] ?? null
}
