import { FakeEmailGateway } from '../application/testing/fake-email-gateway'
import {
  loadContactEmailConfiguration,
  loadContactEmailWorkerConfiguration,
} from './contact-email-configuration'
import { createContactEmailGateway } from './contact-email-worker.module'
import { ResendEmailGateway } from './resend-email-gateway'

function validEnvironment(): NodeJS.ProcessEnv {
  return {
    RESEND_API_KEY: 're_test_key',
    EMAIL_FROM: 'Portfolio <portfolio@example.com>',
    CONTACT_RECIPIENT_EMAIL: 'owner@example.com',
  }
}

describe('loadContactEmailConfiguration', () => {
  it('returns the required contact email settings', () => {
    expect(loadContactEmailConfiguration(validEnvironment())).toEqual({
      apiKey: 're_test_key',
      from: 'Portfolio <portfolio@example.com>',
      to: 'owner@example.com',
    })
  })

  for (const name of [
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'CONTACT_RECIPIENT_EMAIL',
  ] as const) {
    it(`rejects a missing ${name}`, () => {
      const environment = validEnvironment()
      delete environment[name]

      expect(() => loadContactEmailConfiguration(environment)).toThrow(
        `${name} is required to run the contact email worker`,
      )
    })
  }

  it('uses safe development defaults without provider credentials', () => {
    expect(
      loadContactEmailWorkerConfiguration({ NODE_ENV: 'development' }),
    ).toEqual({
      apiKey: 'development-only',
      from: 'Portfolio <development@example.test>',
      to: 'owner@example.test',
    })
  })

  it('still requires all provider settings in production', () => {
    expect(() =>
      loadContactEmailWorkerConfiguration({ NODE_ENV: 'production' }),
    ).toThrow('RESEND_API_KEY is required to run the contact email worker')
  })

  it('uses the non-delivering fake gateway outside production', () => {
    const gateway = createContactEmailGateway(
      { NODE_ENV: 'test' },
      {
        apiKey: 'development-only',
        from: 'Portfolio <development@example.test>',
        to: 'owner@example.test',
      },
    )

    expect(gateway).toBeInstanceOf(FakeEmailGateway)
  })

  it('uses Resend only in production', () => {
    const gateway = createContactEmailGateway(
      { NODE_ENV: 'production' },
      {
        apiKey: 're_test_key',
        from: 'Portfolio <portfolio@example.com>',
        to: 'owner@example.com',
      },
    )

    expect(gateway).toBeInstanceOf(ResendEmailGateway)
  })
})
