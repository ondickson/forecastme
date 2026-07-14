import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const argon2Mock = argon2 as jest.Mocked<typeof argon2>;

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const prismaService = {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as {
    session: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const configuration: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };

      return configuration[key];
    }),
  };

  const user = {
    id: '75f0d849-2025-4cf0-9a47-51335f08d01c',
    email: 'user@example.com',
    passwordHash: 'stored-password-hash',
    displayName: 'Test User',
    role: 'USER',
    isActive: true,
    createdAt: new Date('2026-07-14T00:00:00.000Z'),
    updatedAt: new Date('2026-07-14T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('hashes the password, creates the user, and persists a session', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(user);
      usersService.findById.mockResolvedValue(user);

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prismaService.session.create.mockResolvedValue({
        id: 'session-id',
      });

      argon2Mock.hash.mockResolvedValue('generated-hash');

      const result = await service.register(
        {
          email: ' USER@EXAMPLE.COM ',
          password: 'StrongPassword123!',
          displayName: ' Test User ',
        },
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Jest',
        },
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');

      expect(usersService.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        passwordHash: 'generated-hash',
        displayName: 'Test User',
      });

      expect(prismaService.session.create).toHaveBeenCalled();

      expect(result).toEqual({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      });
    });

    it('rejects a duplicate email address', async () => {
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.register(
          {
            email: user.email,
            password: 'StrongPassword123!',
          },
          {},
        ),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('authenticates a valid active user', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      usersService.findById.mockResolvedValue(user);

      argon2Mock.verify.mockResolvedValue(true);
      argon2Mock.hash.mockResolvedValue('refresh-hash');

      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      prismaService.session.create.mockResolvedValue({
        id: 'session-id',
      });

      const result = await service.login(
        {
          email: user.email,
          password: 'StrongPassword123!',
        },
        {},
      );

      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('rejects an unknown email address', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login(
          {
            email: 'missing@example.com',
            password: 'StrongPassword123!',
          },
          {},
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      usersService.findByEmail.mockResolvedValue(user);
      argon2Mock.verify.mockResolvedValue(false);

      await expect(
        service.login(
          {
            email: user.email,
            password: 'WrongPassword',
          },
          {},
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        sid: 'session-id',
        type: 'refresh',
      });

      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-id',
        userId: user.id,
        refreshTokenHash: 'stored-refresh-hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        user,
      });

      argon2Mock.verify.mockResolvedValue(true);
      argon2Mock.hash.mockResolvedValue('rotated-refresh-hash');

      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      prismaService.session.update.mockResolvedValue({
        id: 'session-id',
      });

      const result = await service.refresh('old-refresh-token', {});

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const updateCall = prismaService.session.update.mock.calls[0] as [
        {
          where: {
            id: string;
          };
          data: {
            refreshTokenHash: string;
            revokedAt: Date | null;
          };
        },
      ];

      const updateInput = updateCall[0];

      expect(updateInput.where).toEqual({
        id: 'session-id',
      });

      expect(updateInput.data.refreshTokenHash).toBe('rotated-refresh-hash');

      expect(updateInput.data.revokedAt).toBeNull();
    });

    it('rejects a revoked session', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        sid: 'session-id',
        type: 'refresh',
      });

      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-id',
        userId: user.id,
        refreshTokenHash: 'stored-refresh-hash',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        user,
      });

      await expect(service.refresh('refresh-token', {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('revokes the matching session', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: user.id,
        sid: 'session-id',
        type: 'refresh',
      });

      prismaService.session.findUnique.mockResolvedValue({
        id: 'session-id',
        userId: user.id,
        refreshTokenHash: 'stored-refresh-hash',
        revokedAt: null,
      });

      argon2Mock.verify.mockResolvedValue(true);

      prismaService.session.update.mockResolvedValue({
        id: 'session-id',
      });

      await service.logout('refresh-token');

      const updateCall = prismaService.session.update.mock.calls[0] as [
        {
          where: {
            id: string;
          };
          data: {
            revokedAt: Date;
          };
        },
      ];

      const updateInput = updateCall[0];

      expect(updateInput.where).toEqual({
        id: 'session-id',
      });

      expect(updateInput.data.revokedAt).toBeInstanceOf(Date);
    });
  });
});
