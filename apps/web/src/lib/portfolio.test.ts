import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioPayload } from './portfolio'
import {
  getPortfolio,
  isSafeExternalUrl,
  PortfolioNotFoundError,
} from './portfolio'

const populatedPayload = {
  profile: {
    name: 'Mark Angel',
    biography: 'Full stack developer.',
    avatarUrl: 'https://cdn.example.com/avatar.png',
    contactEmail: 'owner@example.com',
    phoneNumber: null,
    resumeUrl: 'https://cdn.example.com/resume.pdf',
  },
  skills: [
    { name: 'TypeScript', iconUrl: 'https://cdn.example.com/typescript.svg' },
  ],
  experience: [],
  education: [],
  certifications: [],
  services: [],
  projects: [
    {
      title: 'Archive',
      slug: 'archive',
      description: 'A portfolio archive.',
      imageUrl: 'https://cdn.example.com/archive.png',
      projectUrl: 'https://example.com/archive',
      repositoryUrl: 'https://github.com/example/archive',
      startMonth: '2026-01',
      endMonth: null,
      skills: [
        {
          name: 'TypeScript',
          iconUrl: 'https://cdn.example.com/typescript.svg',
        },
      ],
    },
  ],
} satisfies PortfolioPayload

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('isSafeExternalUrl', () => {
  it('AC-5 accepts HTTPS media URLs and local development HTTP URLs', () => {
    expect(isSafeExternalUrl('https://cdn.example.com/avatar.png')).toBe(true)
    expect(isSafeExternalUrl('http://localhost:3000/image.png')).toBe(true)
  })

  it('AC-5 rejects unsafe or non absolute media URLs', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeExternalUrl('/uploads/avatar.png')).toBe(false)
    expect(isSafeExternalUrl('not-a-url')).toBe(false)
  })

  it('AC-8 rejects HTTP URLs in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(isSafeExternalUrl('http://cdn.example.com/avatar.png')).toBe(false)
    expect(isSafeExternalUrl('https://cdn.example.com/avatar.png')).toBe(true)
  })
})

describe('getPortfolio', () => {
  it('AC-2 and AC-6 preserves populated content and media URLs from the API', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(populatedPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getPortfolio()

    expect(result).toEqual(populatedPayload)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/portfolio',
      expect.objectContaining({
        cache: 'no-store',
      }),
    )
  })

  it.each([429, 500, 503])(
    'AC-6 returns null when the portfolio API responds with status %s',
    async (status) => {
      const fetchMock = vi.fn<typeof fetch>()
      fetchMock.mockResolvedValue(new Response(null, { status }))
      vi.stubGlobal('fetch', fetchMock)

      await expect(getPortfolio()).resolves.toBeNull()
    },
  )

  it('preserves an unpublished profile as a not found error', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortfolio()).rejects.toBeInstanceOf(PortfolioNotFoundError)
  })

  it('returns null when a successful API response has an invalid shape', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ profile: { name: 'Incomplete' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortfolio()).resolves.toBeNull()
  })

  it('AC-6 returns null when the API response is malformed JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(
      new Response('{not-json', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortfolio()).resolves.toBeNull()
  })

  it('AC-6 returns null when the portfolio request fails', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockRejectedValue(new Error('network unavailable'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortfolio()).resolves.toBeNull()
  })

  it('AC-6 returns null when the portfolio request times out', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The request timed out', 'AbortError'))
          })
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = getPortfolio()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(result).resolves.toBeNull()
  })
})
