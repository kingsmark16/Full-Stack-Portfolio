import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import { PrismaService } from '../prisma/prisma.service'

type AuthenticatedRequest = Request & {
  user?: {
    id?: unknown
  }
}

@Injectable()
export class OwnerAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const userId = request.user?.id

    if (typeof userId !== 'string' || userId.length === 0) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        detail: 'Authentication is required',
      })
    }

    const ownerAccess = await this.prisma.ownerAccess.findUnique({
      where: { userId },
      select: { userId: true },
    })

    if (!ownerAccess) {
      throw new ForbiddenException({
        code: 'OWNER_ACCESS_REQUIRED',
        detail: 'Owner access is required',
      })
    }

    return true
  }
}
