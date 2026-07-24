import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OwnerController } from './owner.controller'
import { OwnerAccessGuard } from './owner-access.guard'

@Module({
  imports: [PrismaModule],
  controllers: [OwnerController],
  providers: [OwnerAccessGuard],
})
export class OwnerModule {}
