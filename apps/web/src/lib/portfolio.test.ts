import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PortfolioPayload } from './portfolio'
import { getPortfolio, PortfolioNotFoundError } from './portfolio'

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
        next: { revalidate: 60, tags: ['portfolio'] },
      }),
    )
  })

  it('AC-8 returns null when the portfolio API responds with an error', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortfolio()).resolves.toBeNull()
  })

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
})
