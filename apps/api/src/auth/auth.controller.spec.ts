import { jest } from '@jest/globals';
import { AuthController } from './auth.controller';
import type { AuthService } from './auth.service';
import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;
  let mockConfigService: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      handleGoogleUser: jest.fn(),
      getProfile: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'REFRESH_TOKEN_EXPIRES_IN_DAYS') return 7;
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return defaultValue;
      }),
    };

    mockResponse = {
      cookie: jest.fn() as any,
      redirect: jest.fn() as any,
    };

    controller = new AuthController(
      mockAuthService as unknown as AuthService,
      mockConfigService as unknown as ConfigService,
    );
  });

  it('should register a user and set HttpOnly refresh cookie', async () => {
    mockAuthService.register.mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com', role: 'USER' },
      accessToken: 'access-jwt-token',
      refreshToken: 'refresh-random-token',
    });

    const result = await controller.register(
      { email: 'test@example.com', password: 'Password123!' },
      '127.0.0.1',
      'agent',
      mockResponse as Response,
    );

    expect(result.accessToken).toBe('access-jwt-token');
    expect(result.user.email).toBe('test@example.com');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-random-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/api/v1/auth',
      }),
    );
  });

  it('should login a user and set HttpOnly refresh cookie', async () => {
    mockAuthService.login.mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com', role: 'USER' },
      accessToken: 'access-jwt-token',
      refreshToken: 'refresh-random-token',
    });

    const result = await controller.login(
      { email: 'test@example.com', password: 'Password123!' },
      '127.0.0.1',
      'agent',
      mockResponse as Response,
    );

    expect(result.accessToken).toBe('access-jwt-token');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-random-token',
      expect.objectContaining({
        httpOnly: true,
      }),
    );
  });

  it('should refresh tokens from request cookie and rotate cookie', async () => {
    mockAuthService.refreshTokens.mockResolvedValue({
      user: { id: 'u1', email: 'test@example.com', role: 'USER' },
      accessToken: 'new-access-token',
      refreshToken: 'rotated-refresh-token',
    });

    const mockReq = {
      cookies: { refreshToken: 'incoming-token' },
    } as any;

    const result = await controller.refresh(
      mockReq,
      '127.0.0.1',
      'agent',
      mockResponse as Response,
    );

    expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
      'incoming-token',
      '127.0.0.1',
      'agent',
    );
    expect(result.accessToken).toBe('new-access-token');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'rotated-refresh-token',
      expect.objectContaining({
        httpOnly: true,
      }),
    );
  });

  it('should logout and clear refresh cookie with maxAge 0', async () => {
    mockAuthService.logout.mockResolvedValue({
      success: true,
      message: 'Logged out successfully',
    });

    const mockReq = {
      cookies: { refreshToken: 'logout-token' },
    } as any;

    const result = await controller.logout(mockReq, mockResponse as Response);

    expect(result.success).toBe(true);
    expect(mockAuthService.logout).toHaveBeenCalledWith('logout-token');
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      '',
      expect.objectContaining({
        maxAge: 0,
      }),
    );
  });

  it('should return current user in getMe', () => {
    const dummyUser: any = {
      id: 'user-me-1',
      email: 'me@example.com',
      name: 'Myself',
      role: 'USER',
      planTier: 'FREE',
      createdAt: '2026-10-29T00:00:00Z',
    };

    const result = controller.getMe(dummyUser);
    expect(result.email).toBe('me@example.com');
  });

  it('should handle Google callback, set cookie, and redirect to frontend callback', async () => {
    mockAuthService.handleGoogleUser.mockResolvedValue({
      user: { id: 'g-user-1', email: 'google@test.com' },
      accessToken: 'g-access-token',
      refreshToken: 'g-refresh-token',
    });

    const mockReq = {
      user: {
        googleId: 'g-id-123',
        email: 'google@test.com',
        emailVerified: true,
        name: 'Google User',
      },
    } as any;

    await controller.googleAuthCallback(
      mockReq,
      '127.0.0.1',
      'agent',
      mockResponse as Response,
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'g-refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockResponse.redirect).toHaveBeenCalledWith('http://localhost:3000/auth/callback');
  });

  it('should redirect to login with error if Google auth failed', async () => {
    const mockReq = { user: undefined } as any;

    await controller.googleAuthCallback(
      mockReq,
      '127.0.0.1',
      'agent',
      mockResponse as Response,
    );

    expect(mockResponse.redirect).toHaveBeenCalledWith(
      'http://localhost:3000/login?error=GoogleAuthFailed',
    );
  });
});
