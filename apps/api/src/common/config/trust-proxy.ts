export type TrustProxyConfigurable = {
  set(setting: 'trust proxy', value: number): unknown
}

export function parseTrustProxyHops(
  value: string | undefined,
  environment = process.env.NODE_ENV,
): number {
  if (value === undefined) {
    if (environment === 'production') {
      throw new Error('TRUST_PROXY_HOPS is required in production')
    }

    return 0
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('TRUST_PROXY_HOPS must be a nonnegative integer')
  }

  const hops = Number(value)

  if (!Number.isSafeInteger(hops)) {
    throw new Error('TRUST_PROXY_HOPS must be a safe integer')
  }

  return hops
}

export function configureTrustProxy(
  app: TrustProxyConfigurable,
  value = process.env.TRUST_PROXY_HOPS,
  environment = process.env.NODE_ENV,
): number {
  const hops = parseTrustProxyHops(value, environment)
  app.set('trust proxy', hops)
  return hops
}
