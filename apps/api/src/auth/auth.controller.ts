import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { ValidatedGoogleUser } from './strategies/google.strategy';
import type { UserDto, UserPreferencesDto } from '@lernivox/contracts';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path: string;
    maxAge: number;
    domain?: string;
  } {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('COOKIE_DOMAIN');
    const configuredSameSite = this.configService
      .get<string>('COOKIE_SAME_SITE')
      ?.toLowerCase();
    const configuredSecure = this.configService.get<string | boolean>('COOKIE_SECURE');
    const daysRaw = this.configService.get('REFRESH_TOKEN_EXPIRES_IN_DAYS', 7);
    const days = Number(String(daysRaw).replace(/[^0-9]/g, '')) || 7;

    // In cross-origin production deployments (e.g. Vercel frontend on *.vercel.app
    // and Render API on *.onrender.com), sameSite MUST be 'none' and secure MUST be true
    // for modern browsers to attach the HttpOnly cookie to cross-site credentialed requests.
    let sameSite: 'lax' | 'strict' | 'none' = isProduction ? 'none' : 'lax';
    if (
      configuredSameSite === 'lax' ||
      configuredSameSite === 'strict' ||
      configuredSameSite === 'none'
    ) {
      sameSite = configuredSameSite;
    }

    let secure = isProduction;
    if (configuredSecure !== undefined && configuredSecure !== '') {
      secure =
        configuredSecure === true ||
        configuredSecure === 'true' ||
        configuredSecure === '1';
    }
    // RFC 6265bis: Browsers strictly reject SameSite=None without Secure
    if (sameSite === 'none') {
      secure = true;
    }

    // Sanitize domain: strip protocol, port, and trailing slashes if accidentally provided
    let sanitizedDomain: string | undefined = undefined;
    if (cookieDomain && cookieDomain.trim()) {
      sanitizedDomain = cookieDomain
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');
    }

    return {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/auth',
      maxAge: days * 24 * 60 * 60 * 1000,
      domain: sanitizedDomain || undefined,
    };
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refreshToken', token, this.getCookieOptions());
  }

  private clearRefreshTokenCookie(res: Response): void {
    const options = this.getCookieOptions();
    res.cookie('refreshToken', '', {
      ...options,
      maxAge: 0,
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

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile information for current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully.',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser() user: UserDto,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    return this.authService.updateProfile(user.id, dto.name);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get persisted learning and schedule preferences for current user' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPreferences(@CurrentUser() user: UserDto): Promise<UserPreferencesDto> {
    return this.authService.getPreferences(user.id);
  }

  @Patch('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update persisted learning and schedule preferences for current user' })
  @ApiResponse({ status: 200, description: 'User preferences updated.' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updatePreferences(
    @CurrentUser() user: UserDto,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<UserPreferencesDto> {
    return this.authService.updatePreferences(user.id, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for current authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully. New session tokens issued.',
  })
  @ApiResponse({ status: 400, description: 'Validation failed or not password-authenticated' })
  @ApiResponse({ status: 401, description: 'Incorrect current password or unauthorized' })
  async changePassword(
    @CurrentUser() user: UserDto,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ success: boolean; message: string; accessToken: string; user: UserDto }> {
    const result = await this.authService.changePassword(user.id, dto, ip, userAgent);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    };
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
