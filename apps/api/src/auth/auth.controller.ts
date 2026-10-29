import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  AuthResponseSuccessDto,
  LogoutSuccessDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { ValidatedGoogleUser } from './strategies/google.strategy';
import type { UserDto } from '@lernivox/contracts';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    const days = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
      7,
    );

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: days * 24 * 60 * 60 * 1000,
      domain: cookieDomain || undefined,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 0,
      domain: cookieDomain || undefined,
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user with email and password' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully. Returns user info and access token.',
    type: AuthResponseSuccessDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseSuccessDto> {
    const result = await this.authService.register(dto, ip, userAgent);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns user info and access token.',
    type: AuthResponseSuccessDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseSuccessDto> {
    const result = await this.authService.login(dto, ip, userAgent);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens rotated successfully.',
    type: AuthResponseSuccessDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid, expired, or revoked token' })
  async refresh(
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseSuccessDto> {
    const rawRefreshToken = (req.cookies?.refreshToken as string) || '';
    const result = await this.authService.refreshTokens(rawRefreshToken, ip, userAgent);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({ summary: 'Revoke active session and clear refresh cookie' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully.',
    type: LogoutSuccessDto,
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LogoutSuccessDto> {
    const rawRefreshToken = (req.cookies?.refreshToken as string) || '';
    const result = await this.authService.logout(rawRefreshToken);
    this.clearRefreshTokenCookie(res);
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile of current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: UserDto): UserDto {
    return user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 authentication flow' })
  @ApiResponse({ status: 302, description: 'Redirect to Google authentication' })
  googleAuth(): void {
    // Handled by Passport GoogleStrategy
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Handle Google OAuth 2.0 redirect callback' })
  @ApiResponse({ status: 302, description: 'Redirect to frontend workspace' })
  async googleAuthCallback(
    @Req() req: Request & { user?: ValidatedGoogleUser },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    if (!req.user) {
      res.redirect(`${frontendUrl}/login?error=GoogleAuthFailed`);
      return;
    }

    try {
      const result = await this.authService.handleGoogleUser(req.user, ip, userAgent);
      this.setRefreshTokenCookie(res, result.refreshToken);
      res.redirect(`${frontendUrl}/auth/callback`);
    } catch {
      res.redirect(`${frontendUrl}/login?error=AccountLinkingFailed`);
    }
  }
}
