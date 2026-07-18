import { Injectable, UnprocessableEntityException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContactDto } from './dto/create-contact.dto'

function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error != 'object' || error === null || !('code' in error)) {
    return false
  }
  return error.code === 'P2002'
}

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(dto: CreateContactDto, idempotencyKey: string): Promise<void> {
    const normalizedKey = idempotencyKey.trim()

    if (normalizedKey.length < 1 || normalizedKey.length > 255) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_FAILED',
        detail:
          'The Idempotency-Key header is required and must be 1 to 255 characters.',
      })
    }

    if (dto.honeypot) {
      return
    }

    try {
      await this.prisma.contactMessage.create({
        data: {
          idempotencyKey: normalizedKey,
          name: dto.name,
          email: dto.email,
          message: dto.message,
          emailOutbox: {
            create: {
              deduplicationKey: `contact:${normalizedKey}`,
            },
          },
        },
      })
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        return
      }

      throw error
    }
  }
}
