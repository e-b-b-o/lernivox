import 'reflect-metadata';
import { describe, it, expect } from '@jest/globals';
import { Environment, validate } from './env.validation';

describe('Environment Validation', () => {
  it('validates default development configuration successfully', () => {
    const config = validate({});
    expect(config.NODE_ENV).toBe(Environment.Development);
    expect(config.PORT).toBe(4000);
    expect(config.JWT_SECRET).toBe('lernivox-dev-jwt-secret-minimum-32-chars-long');
  });

  it('accepts valid production configuration with secure JWT_SECRET', () => {
    const config = validate({
      NODE_ENV: 'production',
      JWT_SECRET: 'super-secure-production-jwt-secret-with-high-entropy-64-bytes-long',
    });
    expect(config.NODE_ENV).toBe(Environment.Production);
  });

  it('rejects production configuration using the dev JWT_SECRET default', () => {
    expect(() =>
      validate({
        NODE_ENV: 'production',
        JWT_SECRET: 'lernivox-dev-jwt-secret-minimum-32-chars-long',
      }),
    ).toThrow(/Production security violation/);
  });

  it('rejects production configuration with a short or weak JWT_SECRET (< 32 characters)', () => {
    expect(() =>
      validate({
        NODE_ENV: 'production',
        JWT_SECRET: 'too-short-secret',
      }),
    ).toThrow(/Production security violation/);
  });
});
