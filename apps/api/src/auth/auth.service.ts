import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { ValidatedGoogleUser } from './strategies/google.strategy';
import type { JwtPayload, UserDto } from '@lernivox/contracts';

export interface AuthSessionResult {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshTokenExpiresInDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const daysRaw = this.configService.get(
      'REFRESH_TOKEN_EXPIRES_IN_DAYS',
      7,
    );
    this.refreshTokenExpiresInDays =
      Number(String(daysRaw).replace(/[^0-9]/g, '')) || 7;
  }

  // --- Password Hashing with Argon2id ---

  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  // --- Cryptographic Token Helpers ---

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateAccessToken(user: { id: string; email: string; role: string }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN',
    };
    return this.jwtService.sign(payload);
  }

  sanitizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    planTier: string;
    createdAt: Date;
  }): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'USER' | 'ADMIN',
      planTier: user.planTier as 'FREE' | 'PRO',
      createdAt: user.createdAt.toISOString(),
    };
  }

  // --- Session Lifecycle Management ---

  private async issueSessionTokens(
    user: { id: string; email: string; role: string; name: string | null; planTier: string; createdAt: Date },
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(user);
    const rawRefreshToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date(
      Date.now() + this.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  // --- Registration Flow ---

  async register(
    dto: RegisterDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: dto.name?.trim() || null,
          role: 'USER',
          planTier: 'FREE',
        },
      });

      await tx.userIdentity.create({
        data: {
          userId: newUser.id,
          provider: 'EMAIL_PASSWORD',
          providerAccountId: normalizedEmail,
          passwordHash,
        },
      });

      await tx.userPreference.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    const tokens = await this.issueSessionTokens(user, ip, userAgent);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // --- Email/Password Login Flow ---

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        identities: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const emailIdentity = user.identities.find(
      (identity) => identity.provider === 'EMAIL_PASSWORD',
    );

    if (!emailIdentity || !emailIdentity.passwordHash) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await this.verifyPassword(
      emailIdentity.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.prisma.userIdentity.update({
      where: { id: emailIdentity.id },
      data: { updatedAt: new Date() },
    });

    const tokens = await this.issueSessionTokens(user, ip, userAgent);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // --- Refresh Token Rotation & Reuse Detection ---

  async refreshTokens(
    rawRefreshToken: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSessionResult> {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token provided.');
    }

    const tokenHash = this.hashToken(rawRefreshToken);

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session token.');
    }

    // Reuse Detection: If revoked token is used, terminate all user sessions
    if (session.isRevoked) {
      this.logger.warn(
        `Possible token reuse detected for userId=${session.userId}. Revoking all sessions.`,
      );
      await this.prisma.userSession.updateMany({
        where: { userId: session.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'Suspicious session activity detected. All active sessions have been terminated.',
      );
    }

    // Expiry check
    if (session.expiresAt < new Date()) {
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    if (!session.user.isActive || session.user.deletedAt) {
      throw new UnauthorizedException('User account is invalid or deactivated.');
    }

    // Rotate token: Mark current session as revoked, and create fresh active session
    const newRawRefreshToken = this.generateRandomToken();
    const newTokenHash = this.hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + this.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.userSession.update({
        where: { id: session.id },
        data: { isRevoked: true },
      });

      await tx.userSession.create({
        data: {
          userId: session.userId,
          tokenHash: newTokenHash,
          expiresAt: newExpiresAt,
          ipAddress: ip ?? session.ipAddress,
          userAgent: userAgent ?? session.userAgent,
        },
      });
    });

    const accessToken = this.generateAccessToken(session.user);

    return {
      user: this.sanitizeUser(session.user),
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }

  // --- Logout Flow ---

  async logout(rawRefreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      await this.prisma.userSession.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // --- Google OAuth Profile Handler ---

  async handleGoogleUser(
    googleUser: ValidatedGoogleUser,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthSessionResult> {
    const normalizedEmail = googleUser.email.toLowerCase().trim();

    if (!normalizedEmail) {
      throw new BadRequestException('Google account must provide an email address.');
    }

    // 1. Check if identity already exists by googleId
    const existingIdentity = await this.prisma.userIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'GOOGLE',
          providerAccountId: googleUser.googleId,
        },
      },
      include: { user: true },
    });

    if (existingIdentity) {
      if (!existingIdentity.user.isActive || existingIdentity.user.deletedAt) {
        throw new UnauthorizedException('User account is invalid or deactivated.');
      }

      await this.prisma.userIdentity.update({
        where: { id: existingIdentity.id },
        data: { updatedAt: new Date() },
      });

      const tokens = await this.issueSessionTokens(existingIdentity.user, ip, userAgent);
      return {
        user: this.sanitizeUser(existingIdentity.user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // 2. Check if user exists by email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (!existingUser.isActive || existingUser.deletedAt) {
        throw new UnauthorizedException('User account is invalid or deactivated.');
      }

      // Safe linking: Only link if Google email is verified
      if (!googleUser.emailVerified) {
        throw new BadRequestException(
          'Cannot link Google account because the email is not verified by Google.',
        );
      }

      await this.prisma.userIdentity.create({
        data: {
          userId: existingUser.id,
          provider: 'GOOGLE',
          providerAccountId: googleUser.googleId,
        },
      });

      const tokens = await this.issueSessionTokens(existingUser, ip, userAgent);
      return {
        user: this.sanitizeUser(existingUser),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    }

    // 3. Register new user from Google profile
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name: googleUser.name,
          role: 'USER',
          planTier: 'FREE',
        },
      });

      await tx.userIdentity.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE',
          providerAccountId: googleUser.googleId,
        },
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
        },
      });

      return user;
    });

    const tokens = await this.issueSessionTokens(newUser, ip, userAgent);
    return {
      user: this.sanitizeUser(newUser),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // --- Current User Profile ---

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('User not found or deactivated.');
    }

    return this.sanitizeUser(user);
  }
}
