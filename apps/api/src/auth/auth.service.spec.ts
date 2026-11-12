import { jest } from '@jest/globals';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import type { PrismaService } from '../common/prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userIdentity: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userPreference: {
        create: jest.fn(),
        upsert: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue: any) => {
        if (key === 'REFRESH_TOKEN_EXPIRES_IN_DAYS') return 7;
        if (key === 'JWT_SECRET') return 'test-secret';
        return defaultValue;
      }),
    };

    authService = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
    );
  });

  describe('Password Hashing & Verification (Argon2id)', () => {
    it('should hash a password with Argon2id and verify it successfully', async () => {
      const password = 'TestSecurePassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).toContain('$argon2id$');

      const isValid = await authService.verifyPassword(hash, password);
      expect(isValid).toBe(true);

      const isInvalid = await authService.verifyPassword(hash, 'WrongPassword!');
      expect(isInvalid).toBe(false);
    });
  });

  describe('User Registration', () => {
    it('should successfully register a new user and return tokens and profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const createdUser = {
        id: 'user-uuid-1',
        email: 'alex@lernivox.test',
        name: 'Alex Johnson',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        createdAt: new Date('2026-10-29T00:00:00Z'),
      };

      mockPrisma.user.create.mockResolvedValue(createdUser);
      mockPrisma.userIdentity.create.mockResolvedValue({ id: 'identity-1' });
      mockPrisma.userPreference.create.mockResolvedValue({ id: 'pref-1' });
      mockPrisma.userSession.create.mockResolvedValue({ id: 'session-1' });

      const result = await authService.register(
        {
          email: '  Alex@Lernivox.Test  ',
          password: 'Password123!',
          name: 'Alex Johnson',
        },
        '127.0.0.1',
        'Jest-Agent',
      );

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'alex@lernivox.test' },
      });
      expect(result.user.email).toBe('alex@lernivox.test');
      expect(result.user.role).toBe('USER');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.userSession.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'alex@lernivox.test',
      });

      await expect(
        authService.register({
          email: 'alex@lernivox.test',
          password: 'Password123!',
          name: 'Alex Johnson',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if full name is empty or only whitespace', async () => {
      await expect(
        authService.register({
          email: 'newuser@lernivox.test',
          password: 'Password123!',
          name: '   ',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register users with ordinary email providers (Gmail, Outlook, Yahoo, Proton)', async () => {
      const providers = [
        'student.user@gmail.com',
        'reader.book@outlook.com',
        'scholar@yahoo.com',
        'learner@proton.me',
      ];

      for (const email of providers) {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({
          id: `user-${email}`,
          email,
          name: 'Ordinary User',
          role: 'USER',
          planTier: 'FREE',
          isActive: true,
          createdAt: new Date(),
        });
        mockPrisma.userIdentity.create.mockResolvedValue({ id: 'ident-new' });
        mockPrisma.userPreference.create.mockResolvedValue({ id: 'pref-new' });
        mockPrisma.userSession.create.mockResolvedValue({ id: 'session-new' });

        const result = await authService.register({
          email,
          password: 'Password123!',
          name: 'Ordinary User',
        });

        expect(result.user.email).toBe(email);
        expect(result.accessToken).toBe('mock-jwt-token');
      }
    });
  });

  describe('User Login', () => {
    it('should authenticate user with valid credentials', async () => {
      const password = 'ValidPassword123!';
      const hash = await authService.hashPassword(password);

      const dbUser = {
        id: 'user-uuid-2',
        email: 'student@university.edu',
        name: 'Student User',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        deletedAt: null,
        createdAt: new Date('2026-10-29T00:00:00Z'),
        identities: [
          {
            id: 'ident-2',
            provider: 'EMAIL_PASSWORD',
            providerAccountId: 'student@university.edu',
            passwordHash: hash,
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue(dbUser);
      mockPrisma.userIdentity.update.mockResolvedValue(dbUser.identities[0]);
      mockPrisma.userSession.create.mockResolvedValue({ id: 'session-2' });

      const result = await authService.login({
        email: 'student@university.edu',
        password,
      });

      expect(result.user.email).toBe('student@university.edu');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hash = await authService.hashPassword('CorrectPassword123!');

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid-2',
        email: 'student@university.edu',
        isActive: true,
        deletedAt: null,
        identities: [
          {
            id: 'ident-2',
            provider: 'EMAIL_PASSWORD',
            passwordHash: hash,
          },
        ],
      });

      await expect(
        authService.login({
          email: 'student@university.edu',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive or not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Session Refresh & Token Rotation', () => {
    it('should rotate refresh token and issue new access token on valid refresh', async () => {
      const rawToken = 'valid-refresh-token';
      const tokenHash = authService.hashToken(rawToken);

      const activeSession = {
        id: 'session-valid',
        userId: 'user-1',
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        user: {
          id: 'user-1',
          email: 'user@test.com',
          name: 'User One',
          role: 'USER',
          planTier: 'FREE',
          isActive: true,
          deletedAt: null,
          createdAt: new Date(),
        },
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(activeSession);
      mockPrisma.userSession.update.mockResolvedValue({ ...activeSession });
      mockPrisma.userSession.create.mockResolvedValue({ id: 'session-new' });

      const result = await authService.refreshTokens(rawToken);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).not.toBe(rawToken); // rotated!
      expect(mockPrisma.userSession.update).toHaveBeenCalled();
    });

    it('should revoke ALL user sessions and throw on reuse of revoked token after grace window', async () => {
      const rawToken = 'compromised-token';
      const tokenHash = authService.hashToken(rawToken);

      const revokedSession = {
        id: 'session-compromised',
        userId: 'user-victim',
        tokenHash,
        isRevoked: true, // ALREADY REVOKED!
        updatedAt: new Date(Date.now() - 60000), // Revoked 60s ago (beyond 30s grace period)
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        user: { id: 'user-victim', isActive: true },
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(revokedSession);

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );

      // Verify reuse detection invalidated all sessions for the victim
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-victim' },
        data: { isRevoked: true },
      });
    });

    it('should gracefully handle concurrent refresh within 30s grace window without revoking all sessions', async () => {
      const rawToken = 'concurrent-rotated-token';
      const tokenHash = authService.hashToken(rawToken);

      const recentlyRotatedSession = {
        id: 'session-recent',
        userId: 'user-concurrent',
        tokenHash,
        isRevoked: true,
        updatedAt: new Date(Date.now() - 1000), // Rotated only 1 second ago (within 30s grace period)
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        user: { id: 'user-concurrent', email: 'user@test.com', role: 'USER', planTier: 'FREE', isActive: true, createdAt: new Date() },
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(recentlyRotatedSession);
      mockPrisma.userSession.create.mockResolvedValue({ id: 'session-new-concurrent' });

      const result = await authService.refreshTokens(rawToken);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.refreshToken).toBeDefined();
      // Crucial: updateMany should NOT be called to revoke all sessions
      expect(mockPrisma.userSession.updateMany).not.toHaveBeenCalledWith({
        where: { userId: 'user-concurrent' },
        data: { isRevoked: true },
      });
    });

    it('should reject expired session token', async () => {
      const rawToken = 'expired-token';
      const tokenHash = authService.hashToken(rawToken);

      const expiredSession = {
        id: 'session-expired',
        userId: 'user-1',
        tokenHash,
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000 * 60), // expired 1m ago
        user: { id: 'user-1', isActive: true },
      };

      mockPrisma.userSession.findUnique.mockResolvedValue(expiredSession);

      await expect(authService.refreshTokens(rawToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-expired' },
        data: { isRevoked: true },
      });
    });
  });

  describe('User Logout', () => {
    it('should revoke active session by refresh token hash', async () => {
      const rawToken = 'logout-token';
      const tokenHash = authService.hashToken(rawToken);

      const result = await authService.logout(rawToken);

      expect(result.success).toBe(true);
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    });
  });

  describe('Google OAuth Integration', () => {
    it('should log in existing user linked by Google providerAccountId', async () => {
      const existingGoogleUser = {
        id: 'user-google-1',
        email: 'google@test.com',
        name: 'Google Student',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      };

      mockPrisma.userIdentity.findUnique.mockResolvedValue({
        id: 'ident-google',
        user: existingGoogleUser,
      });
      mockPrisma.userIdentity.update.mockResolvedValue({});
      mockPrisma.userSession.create.mockResolvedValue({});

      const result = await authService.handleGoogleUser({
        googleId: 'google-sub-12345',
        email: 'google@test.com',
        emailVerified: true,
        name: 'Google Student',
      });

      expect(result.user.email).toBe('google@test.com');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should link Google identity to existing email account if email is verified', async () => {
      mockPrisma.userIdentity.findUnique.mockResolvedValue(null);

      const existingAccount = {
        id: 'user-existing',
        email: 'target@test.com',
        name: 'Existing Target',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        deletedAt: null,
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingAccount);
      mockPrisma.userIdentity.create.mockResolvedValue({ id: 'new-linked-ident' });
      mockPrisma.userSession.create.mockResolvedValue({});

      const result = await authService.handleGoogleUser({
        googleId: 'google-sub-999',
        email: 'target@test.com',
        emailVerified: true, // verified!
        name: 'Target Google',
      });

      expect(result.user.id).toBe('user-existing');
      expect(mockPrisma.userIdentity.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-existing',
          provider: 'GOOGLE',
          providerAccountId: 'google-sub-999',
        },
      });
    });

    it('should reject linking existing account if Google email is not verified', async () => {
      mockPrisma.userIdentity.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-existing',
        email: 'target@test.com',
        isActive: true,
      });

      await expect(
        authService.handleGoogleUser({
          googleId: 'google-sub-999',
          email: 'target@test.com',
          emailVerified: false, // unverified!
          name: 'Unverified Google User',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should register a new account from verified Google profile', async () => {
      mockPrisma.userIdentity.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const newGoogleUser = {
        id: 'new-google-user-id',
        email: 'fresh@google.test',
        name: 'Fresh Learner',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        createdAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(newGoogleUser);
      mockPrisma.userIdentity.create.mockResolvedValue({ id: 'id-1' });
      mockPrisma.userPreference.create.mockResolvedValue({ id: 'pref-1' });
      mockPrisma.userSession.create.mockResolvedValue({});

      const result = await authService.handleGoogleUser({
        googleId: 'google-brand-new',
        email: 'fresh@google.test',
        emailVerified: true,
        name: 'Fresh Learner',
      });

      expect(result.user.email).toBe('fresh@google.test');
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('Configuration Resilience', () => {
    it('should safely parse REFRESH_TOKEN_EXPIRES_IN_DAYS when provided as formatted string', async () => {
      const customConfigService = {
        get: jest.fn((key: string, defaultValue: any) => {
          if (key === 'REFRESH_TOKEN_EXPIRES_IN_DAYS') return '14d';
          return defaultValue;
        }),
      };

      const customService = new AuthService(
        mockPrisma as unknown as PrismaService,
        mockJwtService as unknown as JwtService,
        customConfigService as unknown as ConfigService,
      );

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        createdAt: new Date(),
        identities: [
          {
            id: 'id-1',
            provider: 'EMAIL_PASSWORD',
            passwordHash: await authService.hashPassword('Pass123!'),
          },
        ],
      });
      mockPrisma.userIdentity.update.mockResolvedValue({});
      mockPrisma.userSession.create.mockResolvedValue({});

      await customService.login({ email: 'test@example.com', password: 'Pass123!' });

      expect(mockPrisma.userSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('Profile and Password Management', () => {
    it('should update user profile name and reject empty name', async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        name: 'Jane Doe',
        role: 'USER',
        planTier: 'FREE',
        createdAt: new Date(),
      });

      const updated = await authService.updateProfile('u-1', '  Jane Doe  ');
      expect(updated.name).toBe('Jane Doe');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { name: 'Jane Doe' },
      });

      await expect(authService.updateProfile('u-1', '   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should change password, verify old password, and invalidate existing sessions', async () => {
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456!';
      const oldHash = await authService.hashPassword(currentPassword);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'test@example.com',
        name: 'Jane Doe',
        role: 'USER',
        planTier: 'FREE',
        isActive: true,
        createdAt: new Date(),
        identities: [
          {
            id: 'ident-1',
            provider: 'EMAIL_PASSWORD',
            passwordHash: oldHash,
          },
        ],
      });
      mockPrisma.userIdentity.update.mockResolvedValue({});
      mockPrisma.userSession.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.userSession.create.mockResolvedValue({ id: 'session-new-pass' });

      const result = await authService.changePassword('u-1', {
        currentPassword,
        newPassword,
      });

      expect(result.success).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(mockPrisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        data: { isRevoked: true },
      });

      // Incorrect current password
      await expect(
        authService.changePassword('u-1', {
          currentPassword: 'WrongPassword!',
          newPassword,
        }),
      ).rejects.toThrow(UnauthorizedException);

      // Same new password as current
      await expect(
        authService.changePassword('u-1', {
          currentPassword,
          newPassword: currentPassword,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should load and upsert user learning and schedule preferences', async () => {
      const updatedAt = new Date('2026-11-12T10:00:00Z');
      mockPrisma.userPreference.upsert.mockResolvedValue({
        teachingStyle: 'DIRECT',
        explanationLength: 'CONCISE',
        difficulty: 'ADVANCED',
        dailyStudyTargetMinutes: 45,
        studyReminders: false,
        reviewReminders: true,
        theme: 'SYSTEM',
        updatedAt,
      });

      const prefs = await authService.updatePreferences('u-1', {
        teachingStyle: 'DIRECT',
        explanationLength: 'CONCISE',
        difficulty: 'ADVANCED',
        dailyStudyTargetMinutes: 45,
        studyReminders: false,
      });

      expect(mockPrisma.userPreference.upsert).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        create: {
          userId: 'u-1',
          teachingStyle: 'DIRECT',
          explanationLength: 'CONCISE',
          difficulty: 'ADVANCED',
          dailyStudyTargetMinutes: 45,
          studyReminders: false,
        },
        update: {
          teachingStyle: 'DIRECT',
          explanationLength: 'CONCISE',
          difficulty: 'ADVANCED',
          dailyStudyTargetMinutes: 45,
          studyReminders: false,
        },
      });
      expect(prefs.teachingStyle).toBe('DIRECT');
      expect(prefs.dailyStudyTargetMinutes).toBe(45);
      expect(prefs.studyReminders).toBe(false);
      expect(prefs.updatedAt).toBe(updatedAt.toISOString());
    });
  });
});
