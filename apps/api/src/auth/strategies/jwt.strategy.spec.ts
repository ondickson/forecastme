import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const prismaService = {
    session: {
      findUnique: jest.fn(),
    },
  };

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('access-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('returns the authenticated user for a valid active session', async () => {
    prismaService.session.findUnique.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        isActive: true,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-id',
        sid: 'session-id',
        email: 'user@example.com',
        role: 'USER',
        type: 'access',
      }),
    ).resolves.toEqual({
      userId: 'user-id',
      sessionId: 'session-id',
      email: 'user@example.com',
      role: 'USER',
    });
  });

  it('rejects a revoked session', async () => {
    prismaService.session.findUnique.mockResolvedValue({
      id: 'session-id',
      userId: 'user-id',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'user-id',
        email: 'user@example.com',
        role: 'USER',
        isActive: true,
      },
    });

    await expect(
      strategy.validate({
        sub: 'user-id',
        sid: 'session-id',
        email: 'user@example.com',
        role: 'USER',
        type: 'access',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a refresh-token payload', async () => {
    await expect(
      strategy.validate({
        sub: 'user-id',
        sid: 'session-id',
        email: 'user@example.com',
        role: 'USER',
        type: 'refresh' as 'access',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prismaService.session.findUnique).not.toHaveBeenCalled();
  });
});
