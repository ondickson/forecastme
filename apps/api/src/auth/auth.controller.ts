import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from './authenticated-user';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiCreatedResponse({
    description: 'User registered and authenticated',
  })
  register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.authService.register(dto, {
      ipAddress,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate with email and password',
  })
  @ApiOkResponse({
    description: 'Authentication successful',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or disabled account',
  })
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.authService.login(dto, {
      ipAddress,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate the refresh token and issue new tokens',
  })
  @ApiBody({
    type: RefreshTokenDto,
  })
  @ApiOkResponse({
    description: 'New access and refresh tokens issued',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, expired, or reused refresh token',
  })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.authService.refresh(dto.refreshToken, {
      ipAddress,
      userAgent: request.get('user-agent'),
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoke the current refresh-token session',
  })
  @ApiNoContentResponse({
    description: 'Session revoked',
  })
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Return the currently authenticated user',
  })
  @ApiOkResponse({
    description: 'Current user returned',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  async me(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    const user = await this.usersService.findPublicById(
      authenticatedUser.userId,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is unavailable');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
