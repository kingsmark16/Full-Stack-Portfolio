import { loadContactEmailConfiguration } from './contact-email-configuration'

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
})
