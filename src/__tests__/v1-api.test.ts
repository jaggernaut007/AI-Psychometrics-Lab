/**
 * Comprehensive tests for the v1 REST API layer.
 * Covers auth, rate limiting, inventories, assessments, compare, and response envelopes.
 *
 * @author Shreyas Jagannath
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateApiKey } from '@/lib/api-auth';
import { checkRateLimit, resetRateLimiter } from '@/lib/rate-limiter';
import { INVENTORY_METADATA } from '@apl/psychometrics-core';

// ---------------------------------------------------------------------------
// Mock Supabase — must come before any route imports
// ---------------------------------------------------------------------------
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();

function chainable() {
  const chain: Record<string, any> = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
  return chain;
}

let supabaseChain = chainable();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => supabaseChain),
  },
}));

// Mock createOpenRouterBackend and runAssessment
vi.mock('@apl/psychometrics-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@apl/psychometrics-core')>();
  return {
    ...actual,
    createOpenRouterBackend: vi.fn(() => ({
      query: vi.fn().mockResolvedValue('3'),
    })),
    runAssessment: vi.fn().mockResolvedValue({
      modelName: 'test/model',
      persona: 'Base Model',
      timestamp: Date.now(),
      results: {
        bigfive: {
          inventoryName: 'bigfive',
          rawScores: {},
          traitScores: { N: 50, E: 60, O: 70, A: 80, C: 90 },
        },
      },
      logs: [],
    }),
  };
});

// ---------------------------------------------------------------------------
// 1. API Auth Tests
// ---------------------------------------------------------------------------
describe('API Authentication (validateApiKey)', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('rejects when APL_API_KEY is not set', () => {
    delete process.env.APL_API_KEY;
    const result = validateApiKey('Bearer some-key');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not configured/i);
  });

  it('rejects when Authorization header is missing', () => {
    process.env.APL_API_KEY = 'test-secret-key';
    const result = validateApiKey(null);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/missing/i);
  });

  it('rejects when header does not use Bearer scheme', () => {
    process.env.APL_API_KEY = 'test-secret-key';
    const result = validateApiKey('Basic dXNlcjpwYXNz');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/bearer/i);
  });

  it('rejects when token is empty', () => {
    process.env.APL_API_KEY = 'test-secret-key';
    const result = validateApiKey('Bearer ');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  it('rejects when token does not match', () => {
    process.env.APL_API_KEY = 'test-secret-key';
    const result = validateApiKey('Bearer wrong-key');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid/i);
  });

  it('accepts when token matches', () => {
    process.env.APL_API_KEY = 'test-secret-key';
    const result = validateApiKey('Bearer test-secret-key');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. Rate Limiter Tests
// ---------------------------------------------------------------------------
describe('Rate Limiter (checkRateLimit)', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows requests under the limit', () => {
    const result = checkRateLimit('test-ip', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining correctly', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-ip', 5, 60_000);
    }
    const result = checkRateLimit('test-ip', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip', 5, 60_000);
    }
    const result = checkRateLimit('test-ip', 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('provides a resetAt timestamp', () => {
    const before = Date.now();
    const result = checkRateLimit('test-ip', 5, 60_000);
    expect(result.resetAt).toBeGreaterThanOrEqual(before);
    expect(result.resetAt).toBeLessThanOrEqual(before + 60_000 + 100);
  });

  it('uses separate windows per key', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('ip-a', 5, 60_000);
    }
    // ip-a is exhausted
    expect(checkRateLimit('ip-a', 5, 60_000).allowed).toBe(false);
    // ip-b is fresh
    expect(checkRateLimit('ip-b', 5, 60_000).allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Inventories Endpoint
// ---------------------------------------------------------------------------
describe('GET /api/v1/inventories', () => {
  it('returns all 4 inventory metadata entries', async () => {
    const { GET } = await import('@/app/api/v1/inventories/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.meta).toBeDefined();
    expect(json.meta.version).toBe('v1');
    expect(json.meta.timestamp).toBeDefined();
    expect(json.meta.requestId).toBeDefined();

    // All 4 inventories present
    expect(json.data.bigfive).toBeDefined();
    expect(json.data.mbti).toBeDefined();
    expect(json.data.disc).toBeDefined();
    expect(json.data.darktriad).toBeDefined();
  });

  it('includes item counts and dimensions for each inventory', async () => {
    const { GET } = await import('@/app/api/v1/inventories/route');
    const response = await GET();
    const json = await response.json();

    expect(json.data.bigfive.itemCount).toBe(120);
    expect(json.data.bigfive.dimensions).toHaveLength(5);
    expect(json.data.mbti.itemCount).toBe(32);
    expect(json.data.disc.itemCount).toBe(28);
    expect(json.data.darktriad.itemCount).toBe(27);
  });

  it('matches the exported INVENTORY_METADATA', async () => {
    const { GET } = await import('@/app/api/v1/inventories/route');
    const response = await GET();
    const json = await response.json();

    expect(json.data).toEqual(INVENTORY_METADATA);
  });
});

// ---------------------------------------------------------------------------
// 4. Assessments Endpoints
// ---------------------------------------------------------------------------
describe('GET /api/v1/assessments', () => {
  beforeEach(() => {
    supabaseChain = chainable();
  });

  it('returns paginated list with default limit/offset', async () => {
    const mockRuns = [
      { id: 'uuid-1', model_name: 'gpt-4o', persona: 'Base Model', results: {}, created_at: '2025-01-01' },
      { id: 'uuid-2', model_name: 'claude-3', persona: 'Base Model', results: {}, created_at: '2025-01-02' },
    ];

    // Override the final call in the chain to return data
    supabaseChain.range = vi.fn(() => Promise.resolve({ data: mockRuns, error: null, count: 2 }));

    const { GET } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(20);
    expect(json.pagination.offset).toBe(0);
    expect(json.pagination.total).toBe(2);
    expect(json.meta.version).toBe('v1');
  });

  it('applies model filter', async () => {
    supabaseChain.range = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));

    const { GET } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments?model=gpt-4o&limit=10&offset=5');
    const response = await GET(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.offset).toBe(5);

    // Verify ilike was called for filtering
    expect(supabaseChain.ilike).toHaveBeenCalledWith('model_name', '%gpt-4o%');
  });
});

describe('POST /api/v1/assessments', () => {
  beforeEach(() => {
    supabaseChain = chainable();
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY = 'test-openrouter-key';
  });

  it('returns 400 for missing model', async () => {
    const { POST } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventories: ['bigfive'] }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.type).toBe('validation_error');
  });

  it('returns 400 for invalid inventories', async () => {
    const { POST } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'test/model', inventories: ['nonexistent'] }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.detail).toMatch(/invalid inventory/i);
  });

  it('returns 202 with run ID for valid request', async () => {
    supabaseChain.single = vi.fn(() =>
      Promise.resolve({
        data: { id: 'test-uuid-123', model_name: 'test/model' },
        error: null,
      }),
    );

    const { POST } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'test/model',
        inventories: ['bigfive'],
        persona: 'Test Persona',
      }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(202);
    expect(json.data.id).toBe('test-uuid-123');
    expect(json.data.status).toBe('running');
    expect(json.data.estimatedTime).toBeDefined();
    expect(json.meta.version).toBe('v1');
  });
});

// ---------------------------------------------------------------------------
// 5. Compare Endpoint
// ---------------------------------------------------------------------------
describe('POST /api/v1/compare', () => {
  beforeEach(() => {
    supabaseChain = chainable();
  });

  it('returns 400 when no runIds or models provided', async () => {
    const { POST } = await import('@/app/api/v1/compare/route');
    const request = new Request('http://localhost/api/v1/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.type).toBe('validation_error');
  });

  it('returns 400 when fewer than 2 runs found', async () => {
    supabaseChain.in = vi.fn(() =>
      Promise.resolve({
        data: [{ id: '00000000-0000-0000-0000-000000000001', model_name: 'gpt-4o', results: {} }],
        error: null,
      }),
    );

    const { POST } = await import('@/app/api/v1/compare/route');
    const request = new Request('http://localhost/api/v1/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runIds: ['00000000-0000-0000-0000-000000000001'] }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error.detail).toMatch(/at least 2/i);
  });

  it('returns trait-by-trait comparisons for valid runs', async () => {
    const mockRuns = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        model_name: 'gpt-4o',
        persona: 'Base Model',
        created_at: '2025-01-01',
        results: {
          bigfive: {
            inventoryName: 'bigfive',
            rawScores: {},
            traitScores: { N: 50, E: 60, O: 70, A: 80, C: 90 },
          },
        },
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        model_name: 'claude-3',
        persona: 'Base Model',
        created_at: '2025-01-02',
        results: {
          bigfive: {
            inventoryName: 'bigfive',
            rawScores: {},
            traitScores: { N: 40, E: 70, O: 65, A: 85, C: 75 },
          },
        },
      },
    ];

    supabaseChain.in = vi.fn(() =>
      Promise.resolve({ data: mockRuns, error: null }),
    );

    const { POST } = await import('@/app/api/v1/compare/route');
    const request = new Request('http://localhost/api/v1/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runIds: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'] }),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.runCount).toBe(2);
    expect(json.data.comparisons).toHaveLength(1);
    expect(json.data.comparisons[0].inventory).toBe('bigfive');
    expect(json.data.comparisons[0].traits).toHaveLength(5);

    // Check a specific trait delta
    const nTrait = json.data.comparisons[0].traits.find((t: any) => t.trait === 'N');
    expect(nTrait).toBeDefined();
    expect(nTrait.delta).toBe(10);
    expect(nTrait.min).toBe(40);
    expect(nTrait.max).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// 6. Response Envelope Format
// ---------------------------------------------------------------------------
describe('Response Envelope Format', () => {
  it('success responses have data + meta', async () => {
    const { GET } = await import('@/app/api/v1/inventories/route');
    const response = await GET();
    const json = await response.json();

    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('meta');
    expect(json.meta).toHaveProperty('version', 'v1');
    expect(json.meta).toHaveProperty('timestamp');
    expect(json.meta).toHaveProperty('requestId');
    // requestId should look like a UUID
    expect(json.meta.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('error responses have error + meta', async () => {
    const { POST } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(request as any);
    const json = await response.json();

    expect(json).toHaveProperty('error');
    expect(json).toHaveProperty('meta');
    expect(json.error).toHaveProperty('type');
    expect(json.error).toHaveProperty('title');
    expect(json.error).toHaveProperty('status');
    expect(json.error).toHaveProperty('detail');
    expect(json.error.status).toBe(400);
  });

  it('paginated responses have data + meta + pagination', async () => {
    supabaseChain = chainable();
    supabaseChain.range = vi.fn(() =>
      Promise.resolve({ data: [], error: null, count: 0 }),
    );

    const { GET } = await import('@/app/api/v1/assessments/route');
    const request = new Request('http://localhost/api/v1/assessments');
    const response = await GET(request as any);
    const json = await response.json();

    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('meta');
    expect(json).toHaveProperty('pagination');
    expect(json.pagination).toHaveProperty('limit');
    expect(json.pagination).toHaveProperty('offset');
    expect(json.pagination).toHaveProperty('total');
  });
});

// ---------------------------------------------------------------------------
// 7. Docs Endpoint
// ---------------------------------------------------------------------------
describe('GET /api/v1/docs', () => {
  it('returns OpenAPI documentation', async () => {
    const { GET } = await import('@/app/api/v1/docs/route');
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.openapi).toBe('3.0.3');
    expect(json.data.info.title).toMatch(/psychometrics/i);
    expect(json.data.paths).toBeDefined();
    expect(json.data.paths['/assessments']).toBeDefined();
    expect(json.data.paths['/inventories']).toBeDefined();
    expect(json.data.paths['/compare']).toBeDefined();
    expect(json.data.paths['/docs']).toBeDefined();
  });
});
