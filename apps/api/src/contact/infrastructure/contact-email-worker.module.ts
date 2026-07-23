import { randomUUID } from 'node:crypto'
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ContactEmailOutboxWorker } from '../application/contact-email-outbox-worker'
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
  loadContactEmailConfiguration,
  type ContactEmailConfiguration,
} from './contact-email-configuration'
import { PrismaContactEmailOutboxRepository } from './prisma-contact-email-outbox-repository'
import { ResendEmailGateway } from './resend-email-gateway'

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
        loadContactEmailConfiguration(process.env),
    },
    {
      provide: EMAIL_GATEWAY,
      inject: [CONTACT_EMAIL_CONFIGURATION],
      useFactory: (configuration: ContactEmailConfiguration): EmailGateway =>
        new ResendEmailGateway(configuration.apiKey),
    },
    {
      provide: ContactEmailOutboxWorker,
      inject: [
        CONTACT_EMAIL_OUTBOX_REPOSITORY,
        EMAIL_GATEWAY,
        CONTACT_EMAIL_CONFIGURATION,
      ],
      useFactory: (
        repository: ContactEmailOutboxRepository,
        emailGateway: EmailGateway,
        configuration: ContactEmailConfiguration,
      ): ContactEmailOutboxWorker =>
        new ContactEmailOutboxWorker({
          repository,
          emailGateway,
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
