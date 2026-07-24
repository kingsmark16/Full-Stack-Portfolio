import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@thallesp/nestjs-better-auth'
import { OwnerAccessGuard } from './owner-access.guard'

@Controller('owner')
@UseGuards(AuthGuard, OwnerAccessGuard)
export class OwnerController {
  @Get('access')
  getAcess(): { authorized: true } {
    return { authorized: true }
  }
}
