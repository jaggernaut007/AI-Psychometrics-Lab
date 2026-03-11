import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as bigfivePOST, GET as bigfiveGET } from '@/app/api/bigfive/route';
import { POST as mbtiPOST, GET as mbtiGET } from '@/app/api/mbti/route';
import { POST as discPOST, GET as discGET } from '@/app/api/disc/route';
import { POST as psychometricsPOST, GET as psychometricsGET } from '@/app/api/psychometrics/route';
import { BIG_FIVE_ITEMS } from '@/lib/psychometrics/inventories/bigfive';
import { MBTI_ITEMS } from '@/lib/psychometrics/inventories/mbti';
import { DISC_ITEMS } from '@/lib/psychometrics/inventories/disc';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('API Routes', () => {
  // ── Big Five API ──────────────────────────────────────────
  describe('POST /api/bigfive', () => {
    it('should return 400 for missing rawScores', async () => {
      const res = await bigfivePOST(makeRequest({}));
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('should return 400 for null rawScores', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: null }));
      expect(res.status).toBe(400);
    });

    it('should return 400 for non-array scores', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: { '1': 'bad' } }));
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid score format');
    });

    it('should return 400 for out-of-range scores', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: { '1': [6] } }));
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid score value');
    });

    it('should return 400 for scores below 1', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: { '1': [0] } }));
      expect(res.status).toBe(400);
    });

    it('should return 400 for non-numeric scores', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: { '1': ['a'] } }));
      expect(res.status).toBe(400);
    });

    it('should return 200 for valid input', async () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => { rawScores[i.id] = [3, 3, 3]; });

      const res = await bigfivePOST(makeRequest({ rawScores }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });

    it('should return 200 for partial items', async () => {
      const res = await bigfivePOST(makeRequest({ rawScores: { '1': [3, 4, 3] } }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('GET /api/bigfive', () => {
    it('should return API documentation', async () => {
      const res = await bigfiveGET();
      const json = await res.json();
      expect(json.name).toBe('Big Five Personality Scoring API');
      expect(json.domains).toBeDefined();
    });
  });

  // ── MBTI API ──────────────────────────────────────────────
  describe('POST /api/mbti', () => {
    it('should return 400 for missing rawScores', async () => {
      const res = await mbtiPOST(makeRequest({}));
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid scores', async () => {
      const res = await mbtiPOST(makeRequest({ rawScores: { 'mbti_1': [6] } }));
      expect(res.status).toBe(400);
    });

    it('should return 200 for valid input', async () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [3, 3]; });

      const res = await mbtiPOST(makeRequest({ rawScores }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.type).toBeDefined();
    });
  });

  describe('GET /api/mbti', () => {
    it('should return API documentation', async () => {
      const res = await mbtiGET();
      const json = await res.json();
      expect(json.name).toBe('MBTI Personality Scoring API');
      expect(json.dimensions).toBeDefined();
    });
  });

  // ── DISC API ──────────────────────────────────────────────
  describe('POST /api/disc', () => {
    it('should return 400 for missing rawScores', async () => {
      const res = await discPOST(makeRequest({}));
      expect(res.status).toBe(400);
    });

    it('should return 400 for non-numeric scores', async () => {
      const res = await discPOST(makeRequest({ rawScores: { 'disc_1': ['bad'] } }));
      expect(res.status).toBe(400);
    });

    it('should return 200 for valid input', async () => {
      const rawScores: Record<string, number[]> = {};
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [1]; });

      const res = await discPOST(makeRequest({ rawScores }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('GET /api/disc', () => {
    it('should return API documentation', async () => {
      const res = await discGET();
      const json = await res.json();
      expect(json.name).toBe('DISC Personality Scoring API');
      expect(json.dimensions).toBeDefined();
    });
  });

  // ── Psychometrics Combined API ────────────────────────────
  describe('POST /api/psychometrics', () => {
    it('should return 400 for missing rawScores', async () => {
      const res = await psychometricsPOST(makeRequest({}));
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid inventory name', async () => {
      const res = await psychometricsPOST(makeRequest({
        rawScores: { '1': [3] },
        inventories: ['invalid'],
      }));
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe('Invalid inventory name');
    });

    it('should return 400 for empty inventories array', async () => {
      const res = await psychometricsPOST(makeRequest({
        rawScores: { '1': [3] },
        inventories: [],
      }));
      expect(res.status).toBe(400);
    });

    it('should calculate specific inventories', async () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const res = await psychometricsPOST(makeRequest({
        rawScores,
        inventories: ['bigfive'],
      }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.bigfive).toBeDefined();
      expect(json.data.mbti).toBeUndefined();
    });

    it('should calculate all inventories by default', async () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => { rawScores[i.id] = [3]; });
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [3]; });
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [1]; });

      const res = await psychometricsPOST(makeRequest({ rawScores }));
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.data.bigfive).toBeDefined();
      expect(json.data.mbti).toBeDefined();
      expect(json.data.disc).toBeDefined();
    });
  });

  describe('GET /api/psychometrics', () => {
    it('should return API documentation', async () => {
      const res = await psychometricsGET();
      const json = await res.json();
      expect(json.name).toBe('Combined Psychometrics API');
      expect(json.individualEndpoints).toBeDefined();
    });
  });
});
