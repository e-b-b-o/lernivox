import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  api,
  ApiError,
  onTokenRefreshed,
  onSessionExpired,
  silentRefreshToken,
} from '../lib/api.ts';

describe('Centralized API Silent Refresh & Concurrency Guard', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('prevents refresh storms by sharing a single in-flight refresh promise for concurrent requests', async () => {
    let refreshCalls = 0;
    let documentsCalls = 0;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        // Small delay to simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 20));
        return new Response(
          JSON.stringify({
            accessToken: 'refreshed-jwt-token-xyz',
            user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/documents')) {
        documentsCalls++;
        const authHeader = (init?.headers as Record<string, string>)?.[
          'Authorization'
        ];
        if (authHeader === 'Bearer refreshed-jwt-token-xyz') {
          return new Response(JSON.stringify([{ id: 'doc-1', title: 'Test Book' }]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not found', { status: 404 });
    };

    let tokenUpdated = '';
    const unsub = onTokenRefreshed((newToken) => {
      tokenUpdated = newToken;
    });

    // Fire 3 simultaneous requests with expired token
    const [res1, res2, res3] = await Promise.all([
      api.documents.list('expired-old-token'),
      api.documents.list('expired-old-token'),
      api.documents.list('expired-old-token'),
    ]);

    unsub();

    assert.equal(refreshCalls, 1, 'Only 1 refresh request must be sent despite 3 concurrent 401s');
    assert.equal(documentsCalls, 6, 'Each of the 3 requests should be attempted, failed with 401, then retried once');
    assert.equal(res1.length, 1);
    assert.equal(res2.length, 1);
    assert.equal(res3.length, 1);
    assert.equal(tokenUpdated, 'refreshed-jwt-token-xyz');
  });

  test('preserves request body and headers during retry after refresh', async () => {
    let capturedBody = '';
    let capturedAuthHeader = '';

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/auth/refresh')) {
        return new Response(
          JSON.stringify({
            accessToken: 'new-valid-token-123',
            user: { id: 'user-1', email: 'test@example.com' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.includes('/documents/text')) {
        const auth = (init?.headers as Record<string, string>)?.[
          'Authorization'
        ];
        if (auth === 'Bearer new-valid-token-123') {
          capturedBody = init?.body as string;
          capturedAuthHeader = auth;
          return new Response(
            JSON.stringify({
              document: { id: 'doc-new', title: 'Pasted Notes' },
              message: 'Notes saved',
            }),
            { status: 201, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(JSON.stringify({ message: 'Token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not found', { status: 404 });
    };

    const textPayload = {
      title: 'Pasted Notes',
      content: 'Important biology lecture notes from Chapter 4.',
    };

    const res = await api.documents.createFromText(textPayload, 'expired-token');

    assert.equal(res.document.title, 'Pasted Notes');
    assert.equal(capturedAuthHeader, 'Bearer new-valid-token-123');
    assert.equal(JSON.parse(capturedBody).content, textPayload.content);
  });

  test('notifies onSessionExpired when refresh returns 401 and does not retry infinitely', async () => {
    let refreshCalls = 0;
    let expiredNotified = false;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        return new Response(JSON.stringify({ message: 'Refresh token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const unsub = onSessionExpired(() => {
      expiredNotified = true;
    });

    await assert.rejects(
      async () => {
        await api.documents.list('dead-token');
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 401);
        return true;
      },
    );

    unsub();

    assert.equal(refreshCalls, 1);
    assert.equal(expiredNotified, true, 'onSessionExpired subscriber must be notified');
  });

  test('never attempts silent refresh on auth endpoints like /auth/login or /auth/refresh', async () => {
    let refreshCalls = 0;

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/auth/refresh')) {
        refreshCalls++;
        return new Response(JSON.stringify({ message: 'Refresh failed' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/auth/login')) {
        return new Response(JSON.stringify({ message: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('OK', { status: 200 });
    };

    await assert.rejects(
      async () => {
        await api.auth.login({ email: 'bad@example.com', password: 'wrong' });
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 401);
        assert.equal(err.message, 'Invalid credentials');
        return true;
      },
    );

    assert.equal(refreshCalls, 0, 'Must NOT attempt refresh on /auth/login 401');
  });

  test('propagates HTTP 500 server errors cleanly with server error message', async () => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          statusCode: 500,
          error: { message: 'Internal server error' },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    };

    await assert.rejects(
      async () => {
        await api.auth.login({ email: 'user@example.com', password: 'password123' });
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 500);
        assert.equal(err.message, 'Internal server error');
        return true;
      },
    );
  });

  test('provides user-friendly connection error without dev-only port references', async () => {
    globalThis.fetch = async () => {
      throw new Error('Failed to fetch (network error)');
    };

    await assert.rejects(
      async () => {
        await api.auth.login({ email: 'user@example.com', password: 'password123' });
      },
      (err: any) => {
        assert(err instanceof ApiError);
        assert.equal(err.statusCode, 0);
        assert(!err.message.includes('port 4000'), 'Error message must not reference local port 4000');
        assert(err.message.includes('Cannot connect to API'));
        return true;
      },
    );
  });
});
