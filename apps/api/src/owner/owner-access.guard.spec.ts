import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { OwnerAccessGuard } from './owner-access.guard'

type RequestUser = {
  id?: unknown
}

type PrismaStub = {
  ownerAccess: {
    findUnique: jest.Mock
  }
}

function createContext(user?: RequestUser): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext
}

function createPrismaStub(): PrismaStub {
  return {
    ownerAccess: {
      findUnique: jest.fn(),
    },
  }
}

describe('OwnerAccessGuard', () => {
  it('rejects an unauthenticated request', async () => {
    const prisma = createPrismaStub()
    const guard = new OwnerAccessGuard(prisma as unknown as PrismaService)

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )

    expect(prisma.ownerAccess.findUnique).not.toHaveBeenCalled()
  })

  it('rejects an authenticated non-owner', async () => {
    const prisma = createPrismaStub()
    prisma.ownerAccess.findUnique.mockResolvedValue(null)

    const guard = new OwnerAccessGuard(prisma as unknown as PrismaService)

    await expect(
      guard.canActivate(createContext({ id: 'not-the-owner' })),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(prisma.ownerAccess.findUnique).toHaveBeenCalledWith({
      where: { userId: 'not-the-owner' },
      select: { userId: true },
    })
  })

  it('allows the configured owner', async () => {
    const prisma = createPrismaStub()
    prisma.ownerAccess.findUnique.mockResolvedValue({
      userId: 'owner-user-id',
    })

    const guard = new OwnerAccessGuard(prisma as unknown as PrismaService)

    await expect(
      guard.canActivate(createContext({ id: 'owner-user-id' })),
    ).resolves.toBe(true)
  })
})
