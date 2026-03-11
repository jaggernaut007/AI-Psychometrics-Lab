/**
 * Next.js middleware for API v1 authentication and rate limiting.
 * Runs in the Edge Runtime. Intercepts /api/v1/* routes
 * (except /api/v1/inventories and /api/v1/docs which are public).
 *
 * @author Shreyas Jagannath
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Constant-time comparison (inline for Edge Runtime compatibility).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let result = 1;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter (per-process, Edge-safe)
// ---------------------------------------------------------------------------
const rateLimitWindows = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  let entry = rateLimitWindows.get(key);

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitWindows.set(key, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
    resetAt: entry.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /api/v1/* routes
  if (!pathname.startsWith('/api/v1')) {
    return NextResponse.next();
  }

  // Public endpoints — no auth required
  if (pathname === '/api/v1/inventories' || pathname === '/api/v1/docs') {
    return NextResponse.next();
  }

  // --- Authentication ---
  const apiKey = process.env.APL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          type: 'server_error',
          title: 'API Key Not Configured',
          status: 500,
          detail: 'The server has not been configured with an API key.',
        },
      },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: {
          type: 'authentication_error',
          title: 'Unauthorized',
          status: 401,
          detail: 'Missing or malformed Authorization header. Use: Bearer <api_key>',
        },
      },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);

  if (!timingSafeEqual(token, apiKey)) {
    return NextResponse.json(
      {
        error: {
          type: 'authentication_error',
          title: 'Forbidden',
          status: 403,
          detail: 'Invalid API key.',
        },
      },
      { status: 403 },
    );
  }

  // --- Rate Limiting ---
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const rateResult = checkRateLimit(clientIp);

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: {
          type: 'rate_limit_error',
          title: 'Too Many Requests',
          status: 429,
          detail: `Rate limit exceeded. Try again after ${new Date(rateResult.resetAt).toISOString()}.`,
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateResult.resetAt / 1000)),
          'Retry-After': String(Math.ceil((rateResult.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  // Pass through with rate limit headers
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateResult.resetAt / 1000)));

  return response;
}

export const config = {
  matcher: ['/api/v1/:path*'],
};
