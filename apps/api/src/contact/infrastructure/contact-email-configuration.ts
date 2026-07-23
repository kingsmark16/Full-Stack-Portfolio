export const CONTACT_EMAIL_CONFIGURATION = Symbol('CONTACT_EMAIL_CONFIGURATION')

export type ContactEmailConfiguration = Readonly<{
  apiKey: string
  from: string
  to: string
}>

type RequiredEnvironmentVariable =
  'RESEND_API_KEY' | 'EMAIL_FROM' | 'CONTACT_RECIPIENT_EMAIL'

function requiredEnvironmentValue(
  environment: NodeJS.ProcessEnv,
  name: RequiredEnvironmentVariable,
): string {
  const value = environment[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required to run the contact email worker`)
  }

  return value
}

export function loadContactEmailConfiguration(
  environment: NodeJS.ProcessEnv,
): ContactEmailConfiguration {
  return {
    apiKey: requiredEnvironmentValue(environment, 'RESEND_API_KEY'),
    from: requiredEnvironmentValue(environment, 'EMAIL_FROM'),
    to: requiredEnvironmentValue(environment, 'CONTACT_RECIPIENT_EMAIL'),
  }
}
