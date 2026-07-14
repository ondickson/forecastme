import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';
import type {
  AccessTokenPayload,
  AuthenticationContext,
  AuthenticationResult,
  AuthenticationTokens,
  PublicUser,
  RefreshTokenPayload,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    context: AuthenticationContext,
  ): Promise<AuthenticationResult> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.usersService.create({
      email,
      passwordHash,
      displayName: dto.displayName?.trim(),
    });

    const tokens = await this.createSession(user.id, context);

    return {
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async login(
    dto: LoginDto,
    context: AuthenticationContext,
  ): Promise<AuthenticationResult> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account is disabled');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.createSession(user.id, context);

    return {
      user: this.toPublicUser(user),
      tokens,
    };
  }

  async refresh(
    refreshToken: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const session = await this.prisma.session.findUnique({
      where: {
        id: payload.sid,
      },
      include: {
        user: true,
      },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    if (!session.user.isActive) {
      throw new UnauthorizedException('This account is disabled');
    }

    const tokenMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!tokenMatches) {
      await this.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return this.rotateSession(
      session.id,
      session.user.id,
      session.user.email,
      session.user.role,
      context,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshToken(refreshToken, true);

    const session = await this.prisma.session.findUnique({
      where: {
        id: payload.sid,
      },
    });

    if (!session || session.userId !== payload.sub || session.revokedAt) {
      return;
    }

    const tokenMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async createSession(
    userId: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unable to create a session');
    }

    const sessionId = randomUUID();
    const tokens = await this.issueTokens(
      user.id,
      sessionId,
      user.email,
      user.role,
    );

    const refreshTokenHash = await argon2.hash(tokens.refreshToken);
    const expiresAt = this.getRefreshExpirationDate();

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        expiresAt,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return tokens;
  }

  private async rotateSession(
    sessionId: string,
    userId: string,
    email: string,
    role: string,
    context: AuthenticationContext,
  ): Promise<AuthenticationTokens> {
    const tokens = await this.issueTokens(userId, sessionId, email, role);

    const refreshTokenHash = await argon2.hash(tokens.refreshToken);
    const expiresAt = this.getRefreshExpirationDate();

    await this.prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash,
        expiresAt,
        revokedAt: null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });

    return tokens;
  }

  private async issueTokens(
    userId: string,
    sessionId: string,
    email: string,
    role: string,
  ): Promise<AuthenticationTokens> {
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      sid: sessionId,
      email,
      role,
      type: 'access',
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sid: sessionId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getJwtExpiration('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.getJwtExpiration('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
    ignoreExpiration = false,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          ignoreExpiration,
        },
      );

      if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private getJwtExpiration(
    key: 'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN',
  ): JwtSignOptions['expiresIn'] {
    return this.configService.getOrThrow<string>(
      key,
    ) as JwtSignOptions['expiresIn'];
  }

  private getRefreshExpirationDate(): Date {
    const duration = this.configService.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    return new Date(Date.now() + this.parseDuration(duration));
  }

  private parseDuration(value: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(value.trim());

    if (!match) {
      throw new Error(
        `Invalid token duration "${value}". Use formats such as 15m, 1h, or 7d.`,
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };

    return amount * multipliers[unit];
  }
}
