import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AuthModule } from '@thallesp/nestjs-better-auth'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { PortfolioModule } from './portfolio/portfolio.module'
import { PrismaModule } from './prisma/prisma.module'
import { ContactModule } from './contact/contact.module'
import { auth } from './auth/auth'
import { OwnerModule } from './owner/owner.module'

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 60,
        },
      ],
    }),
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
    PrismaModule,
    PortfolioModule,
    ContactModule,
    OwnerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
