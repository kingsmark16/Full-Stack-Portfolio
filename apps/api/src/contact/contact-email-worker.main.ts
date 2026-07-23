import 'dotenv/config'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ContactEmailOutboxWorker } from './application/contact-email-outbox-worker'
import { CONTACT_EMAIL_POLL_INTERVAL_MS } from './domain/contact-email-delivery-policy'
import { ContactEmailWorkerModule } from './infrastructure/contact-email-worker.module'

const SHUTDOWN_GRACE_PERIOD_MS = 30_000

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('ContactEmailWorker')
  const application = await NestFactory.createApplicationContext(
    ContactEmailWorkerModule,
  )
  const worker = application.get(ContactEmailOutboxWorker)

  let stopping = false
  let activePoll: Promise<void> | null = null

  const poll = async (): Promise<void> => {
    if (stopping || activePoll) {
      return
    }

    activePoll = worker.processAvailable().then(() => undefined)

    try {
      await activePoll
    } catch {
      logger.error('Contact email outbox poll failed')
    } finally {
      activePoll = null
    }
  }

  const interval = setInterval(() => {
    void poll()
  }, CONTACT_EMAIL_POLL_INTERVAL_MS)

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (stopping) {
      return
    }

    stopping = true
    logger.log(`Received ${signal}; stopping contact email worker`)

    clearInterval(interval)

    if (activePoll) {
      await Promise.race([
        activePoll.catch(() => undefined),
        wait(SHUTDOWN_GRACE_PERIOD_MS),
      ])
    }

    await application.close()
  }

  process.once('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM')
  })

  await poll()
}

void bootstrap().catch(() => {
  const logger = new Logger('ContactEmailWorker')
  logger.error(
    'Contact email worker could not start; check its required environment variables',
  )
  process.exitCode = 1
})
