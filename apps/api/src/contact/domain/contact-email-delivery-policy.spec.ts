import {
  CONTACT_EMAIL_MAX_ATTEMPTS,
  retryDelayForAttempt,
} from './contact-email-delivery-policy'

describe('retryDelayForAttempt', () => {
  it('uses the approved exponential retry schedule', () => {
    expect(retryDelayForAttempt(1)).toBe(60_000)
    expect(retryDelayForAttempt(2)).toBe(5 * 60_000)
    expect(retryDelayForAttempt(3)).toBe(25 * 60_000)
    expect(retryDelayForAttempt(4)).toBe(125 * 60_000)
    expect(retryDelayForAttempt(CONTACT_EMAIL_MAX_ATTEMPTS)).toBeNull()
  })

  it('rejects invalid attempt counts', () => {
    expect(() => retryDelayForAttempt(0)).toThrow(
      'attemptCount must be a positive integer',
    )
    expect(() => retryDelayForAttempt(1.5)).toThrow(
      'attemptCount must be a positive integer',
    )
  })
})
