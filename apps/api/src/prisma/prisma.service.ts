import 'dotenv/config'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '../../generated/prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured')
    }
    super({
      adapter: new PrismaNeon({ connectionString }),
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
