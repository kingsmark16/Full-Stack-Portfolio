import { configureTrustProxy, parseTrustProxyHops } from './trust-proxy'

describe('trust proxy configuration', () => {
  it('defaults to no trusted proxy hops outside production', () => {
    expect(parseTrustProxyHops(undefined, 'development')).toBe(0)
    expect(parseTrustProxyHops(undefined, 'test')).toBe(0)
  })

  it('requires trusted proxy hops in production', () => {
    expect(() => parseTrustProxyHops(undefined, 'production')).toThrow(
      'TRUST_PROXY_HOPS is required in production',
    )
  })

  it('parses a configured nonnegative hop count', () => {
    expect(parseTrustProxyHops('2')).toBe(2)
  })

  it('rejects invalid hop counts', () => {
    expect(() => parseTrustProxyHops('-1')).toThrow(
      'TRUST_PROXY_HOPS must be a nonnegative integer',
    )
    expect(() => parseTrustProxyHops('one')).toThrow(
      'TRUST_PROXY_HOPS must be a nonnegative integer',
    )
  })

  it('configures the Express trust proxy setting', () => {
    const set = jest.fn()

    expect(configureTrustProxy({ set }, '1', 'production')).toBe(1)
    expect(set).toHaveBeenCalledWith('trust proxy', 1)
  })
})
