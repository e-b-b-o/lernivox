import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../common/prisma/prisma.service';

describe('Authentication Vertical Feature (End-to-End)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `e2e-test-${Date.now()}@lernivox.test`;
  const testPassword = 'StrongPassword123!';
  const testName = 'E2E Scholar';

  let accessToken: string;
  let refreshTokenCookie: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data created during e2e run
    try {
      const user = await prisma.user.findUnique({ where: { email: testEmail } });
      if (user) {
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch {
      // ignore
    }
    await app.close();
  });

  describe('1. User Registration (POST /api/v1/auth/register)', () => {
    it('should reject registration with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('valid email')]),
      );
    });

    it('should reject registration with password shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'valid@lernivox.test',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('at least 8 characters')]),
      );
    });

    it('should successfully register a new user and set HttpOnly refresh cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user.name).toBe(testName);
      expect(response.body.user.role).toBe('USER');
      expect(response.body.accessToken).toBeDefined();

      // Verify Set-Cookie header for refresh token
      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
      expect(cookies.some((c: string) => c.includes('Path=/api/v1/auth'))).toBe(true);
    });

    it('should reject duplicate registration with 409 Conflict', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: testName,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('2. User Login (POST /api/v1/auth/login)', () => {
    it('should reject login with incorrect password with 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should reject login for nonexistent user with 401 without enumeration', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent-scholar@lernivox.test',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should successfully log in with valid credentials and return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.accessToken).toBeDefined();

      accessToken = response.body.accessToken;

      // Extract refresh cookie
      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      const rawCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(rawCookie).toBeDefined();
      refreshTokenCookie = rawCookie!.split(';')[0]!;
    });
  });

  describe('3. Current User Verification (GET /api/v1/auth/me)', () => {
    it('should reject request without Bearer token with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid Bearer token with 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(response.status).toBe(401);
    });

    it('should return profile of authenticated user when Bearer token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testEmail);
      expect(response.body.name).toBe(testName);
      expect(response.body.role).toBe('USER');
      expect(response.body.planTier).toBe('FREE');
      expect(response.body.passwordHash).toBeUndefined(); // Sensitive fields never exposed!
    });
  });

  describe('4. Token Rotation & Reuse Detection (POST /api/v1/auth/refresh)', () => {
    let rotatedCookie: string;

    it('should reject refresh request without refresh cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('No refresh token provided');
    });

    it('should rotate refresh token and return fresh access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe(testEmail);

      // Verify old token was replaced with rotated token
      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      const rawCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
      expect(rawCookie).toBeDefined();
      rotatedCookie = rawCookie!.split(';')[0]!;
      expect(rotatedCookie).not.toEqual(refreshTokenCookie);
    });

    it('should detect token reuse and terminate sessions if old refresh token is reused', async () => {
      // Present old, replaced refresh token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshTokenCookie);

      // Should be rejected
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('activity detected');

      // Now rotatedCookie should ALSO be revoked because reuse detection revoked all sessions
      const subsequentResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', rotatedCookie);

      expect(subsequentResponse.status).toBe(401);
    });
  });

  describe('5. User Logout (POST /api/v1/auth/logout)', () => {
    let newLoginCookie: string;

    beforeAll(async () => {
      // Log in again to get a fresh session
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testEmail, password: testPassword });

      const cookies = (res.headers['set-cookie'] as unknown as string[]) || [];
      newLoginCookie = cookies.find((c: string) => c.startsWith('refreshToken='))!.split(';')[0]!;
    });

    it('should revoke active session and clear refresh cookie on logout', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', newLoginCookie);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify cookie is cleared (Max-Age=0)
      const cookies = (response.headers['set-cookie'] as unknown as string[]) || [];
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies.some((c: string) => c.includes('Max-Age=0') || c.includes('expires='))).toBe(true);

      // Attempting to refresh with the logged-out cookie must fail
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', newLoginCookie);

      expect(refreshResponse.status).toBe(401);
    });
  });
});
