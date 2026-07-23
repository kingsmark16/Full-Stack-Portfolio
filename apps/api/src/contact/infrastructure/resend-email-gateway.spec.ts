import { ResendEmailGateway } from './resend-email-gateway'

const outboundEmail = {
  from: 'Portfolio <portfolio@example.com>',
  to: 'owner@example.com',
  replyTo: 'visitor@example.com',
  subject: 'Portfolio contact message',
  text: 'Name: Ada Lovelace',
  idempotencyKey: 'contact:submission-001',
} as const

describe('ResendEmailGateway', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('retries Resend concurrent idempotency responses', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          name: 'concurrent_idempotent_requests',
          message: 'The request is already being processed.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await expect(
      new ResendEmailGateway('re_test_key').send(outboundEmail),
    ).rejects.toMatchObject({
      retryable: true,
      category: 'concurrent_idempotent_requests',
      statusCode: 409,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.anything(),
    )
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('aborts the provider request when the timeout expires', async () => {
    let aborted = false
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation((_input, init) => {
        init?.signal?.addEventListener('abort', () => {
          aborted = true
        })

        return new Promise<Response>(() => undefined)
      })

    await expect(
      new ResendEmailGateway('re_test_key', 10).send(outboundEmail),
    ).rejects.toMatchObject({
      retryable: true,
      category: 'timeout',
    })

    expect(fetchMock).toHaveBeenCalled()
    expect(aborted).toBe(true)
  })

  it('keeps non-retryable provider errors final', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 422,
          name: 'invalid_from_address',
          message: 'The sender is not verified.',
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await expect(
      new ResendEmailGateway('re_test_key').send(outboundEmail),
    ).rejects.toMatchObject({
      retryable: false,
      category: 'invalid_from_address',
      statusCode: 422,
    })
  })
})
