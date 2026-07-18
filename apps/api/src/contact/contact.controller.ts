import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common'
import { ContactService } from './contact.service'
import { Throttle } from '@nestjs/throttler'
import { CreateContactDto } from './dto/create-contact.dto'

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  async submit(
    @Body() dto: CreateContactDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<{ accepted: true }> {
    if (!idempotencyKey) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_FAILED',
        detail: 'The Idempotency-key header is required.',
      })
    }

    await this.contactService.submit(dto, idempotencyKey)

    return { accepted: true }
  }
}
