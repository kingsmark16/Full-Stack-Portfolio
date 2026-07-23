import { randomUUID } from 'node:crypto'
import { Logger, Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ContactEmailOutboxWorker } from '../application/contact-email-outbox-worker'
import {
  CONTACT_EMAIL_DELIVERY_LOGGER,
  type ContactEmailDeliveryLogger,
} from '../application/ports/contact-email-delivery-logger'
import {
  CONTACT_EMAIL_OUTBOX_REPOSITORY,
  type ContactEmailOutboxRepository,
} from '../application/ports/contact-email-outbox-repository'
import {
  EMAIL_GATEWAY,
  type EmailGateway,
} from '../application/ports/email-gateway'
import {
  CONTACT_EMAIL_CONFIGURATION,
  loadContactEmailWorkerConfiguration,
  type ContactEmailConfiguration,
} from './contact-email-configuration'
import { PrismaContactEmailOutboxRepository } from './prisma-contact-email-outbox-repository'
import { ResendEmailGateway } from './resend-email-gateway'
import { FakeEmailGateway } from '../application/testing/fake-email-gateway'

export function createContactEmailGateway(
  environment: NodeJS.ProcessEnv,
  configuration: ContactEmailConfiguration,
): EmailGateway {
  return environment.NODE_ENV === 'production'
    ? new ResendEmailGateway(configuration.apiKey)
    : new FakeEmailGateway()
}

class NestContactEmailDeliveryLogger implements ContactEmailDeliveryLogger {
  private readonly logger = new Logger('ContactEmailOutboxWorker')

  finalFailure(failure: {
    outboxId: string
    category: string
    statusCode: number | null
  }): void {
    this.logger.error(
      `Contact email delivery failed permanently: outboxId=${failure.outboxId} category=${failure.category} status=${failure.statusCode ?? 'unknown'}`,
    )
  }
}

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaContactEmailOutboxRepository,
    {
      provide: CONTACT_EMAIL_OUTBOX_REPOSITORY,
      useExisting: PrismaContactEmailOutboxRepository,
    },
    {
      provide: CONTACT_EMAIL_CONFIGURATION,
      useFactory: (): ContactEmailConfiguration =>
        loadContactEmailWorkerConfiguration(process.env),
    },
    {
      provide: EMAIL_GATEWAY,
      inject: [CONTACT_EMAIL_CONFIGURATION],
      useFactory: (configuration: ContactEmailConfiguration): EmailGateway =>
        createContactEmailGateway(process.env, configuration),
    },
    {
      provide: CONTACT_EMAIL_DELIVERY_LOGGER,
      useClass: NestContactEmailDeliveryLogger,
    },
    {
      provide: ContactEmailOutboxWorker,
      inject: [
        CONTACT_EMAIL_OUTBOX_REPOSITORY,
        EMAIL_GATEWAY,
        CONTACT_EMAIL_CONFIGURATION,
        CONTACT_EMAIL_DELIVERY_LOGGER,
      ],
      useFactory: (
        repository: ContactEmailOutboxRepository,
        emailGateway: EmailGateway,
        configuration: ContactEmailConfiguration,
        logger: ContactEmailDeliveryLogger,
      ): ContactEmailOutboxWorker =>
        new ContactEmailOutboxWorker({
          repository,
          emailGateway,
          logger,
          from: configuration.from,
          to: configuration.to,
          now: () => new Date(),
          createLeaseToken: randomUUID,
        }),
    },
  ],
  exports: [ContactEmailOutboxWorker],
})
export class ContactEmailWorkerModule {}
