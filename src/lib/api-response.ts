/**
 * Standardized API response envelope helpers for v1 endpoints.
 *
 * @author Shreyas Jagannath
 */

import { NextResponse } from 'next/server';

/**
 * Generate a unique request ID (UUID v4-style).
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

interface MetaFields {
  version: string;
  timestamp: string;
  requestId: string;
}

interface PaginationFields {
  limit: number;
  offset: number;
  total: number;
}

/**
 * Build the standard meta object included in every response.
 */
function buildMeta(): MetaFields {
  return {
    version: 'v1',
    timestamp: new Date().toISOString(),
    requestId: generateRequestId(),
  };
}

/**
 * Return a successful data response with the v1 envelope.
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      data,
      meta: buildMeta(),
    },
    { status },
  );
}

/**
 * Return a successful paginated list response.
 */
export function apiPaginatedSuccess<T>(
  data: T,
  pagination: PaginationFields,
  status: number = 200,
): NextResponse {
  return NextResponse.json(
    {
      data,
      meta: buildMeta(),
      pagination,
    },
    { status },
  );
}

/**
 * Return a structured error response.
 */
export function apiError(
  type: string,
  title: string,
  status: number,
  detail: string,
): NextResponse {
  return NextResponse.json(
    {
      error: { type, title, status, detail },
      meta: buildMeta(),
    },
    { status },
  );
}
