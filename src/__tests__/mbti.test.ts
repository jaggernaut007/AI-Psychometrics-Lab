import { describe, it, expect } from 'vitest';
import { calculateMBTIScores, deriveMBTIFromBigFive, MBTI_ITEMS } from '@/lib/psychometrics/inventories/mbti';
import { InventoryResult } from '@/lib/psychometrics/types';

describe('MBTI Inventory', () => {
  describe('MBTI_ITEMS', () => {
    it('should have exactly 32 items', () => {
      expect(MBTI_ITEMS).toHaveLength(32);
    });

    it('should have 8 items per dimension', () => {
      const counts: Record<string, number> = {};
      MBTI_ITEMS.forEach(i => {
        if (i.dimension) {
          counts[i.dimension] = (counts[i.dimension] || 0) + 1;
        }
      });
      expect(counts['IE']).toBe(8);
      expect(counts['SN']).toBe(8);
      expect(counts['TF']).toBe(8);
      expect(counts['JP']).toBe(8);
    });

    it('should have unique IDs', () => {
      const ids = MBTI_ITEMS.map(i => i.id);
      expect(new Set(ids).size).toBe(32);
    });

    it('should have leftText and rightText for all items', () => {
      MBTI_ITEMS.forEach(i => {
        expect(i.leftText, `Item ${i.id} missing leftText`).toBeTruthy();
        expect(i.rightText, `Item ${i.id} missing rightText`).toBeTruthy();
      });
    });
  });

  describe('calculateMBTIScores', () => {
    it('should return correct structure', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateMBTIScores(rawScores);
      expect(result.inventoryName).toBe('MBTI (OEJTS 1.2)');
      expect(result.type).toHaveLength(4);
      expect(result.psi).toBeDefined();
      expect(result.traitScores).toBeDefined();
    });

    it('should produce ISTJ for all-1 responses (without calibration)', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [1]; });

      const result = calculateMBTIScores(rawScores, false);
      // Sum per dimension = 8*1 = 8, which is < 24
      // IE<24 -> I, SN<24 -> S, TF<24 -> F, JP<24 -> J
      expect(result.type).toBe('ISFJ');
    });

    it('should produce ENTP for all-5 responses (without calibration)', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [5]; });

      const result = calculateMBTIScores(rawScores, false);
      // Sum per dimension = 8*5 = 40, which is > 24
      // IE>24 -> E, SN>24 -> N, TF>24 -> T, JP>24 -> P
      expect(result.type).toBe('ENTP');
    });

    it('should calculate PSI values between 0 and 1', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateMBTIScores(rawScores);
      Object.values(result.psi!).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });

    it('should produce maximum PSI for extreme scores', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [5]; });

      const result = calculateMBTIScores(rawScores, false);
      // Sum = 40, PSI = |40-24|/16 = 1.0
      expect(result.psi!.IE).toBe(1);
      expect(result.psi!.SN).toBe(1);
    });

    it('should have complementary single-letter scores', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [4]; });

      const result = calculateMBTIScores(rawScores, false);
      // E + I should = 48
      expect(result.traitScores['E'] + result.traitScores['I']).toBe(48);
      expect(result.traitScores['N'] + result.traitScores['S']).toBe(48);
      expect(result.traitScores['T'] + result.traitScores['F']).toBe(48);
      expect(result.traitScores['P'] + result.traitScores['J']).toBe(48);
    });

    it('should store raw scores when calibration is enabled', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateMBTIScores(rawScores, true);
      expect(result.traitScores['_raw_IE']).toBeDefined();
      expect(result.traitScores['_raw_SN']).toBeDefined();
      expect(result.traitScores['_raw_TF']).toBeDefined();
      expect(result.traitScores['_raw_JP']).toBeDefined();
      expect(result.details.calibrated).toBe(true);
    });

    it('should handle missing items gracefully', () => {
      const rawScores: Record<string, number[]> = {};
      // Only provide IE items
      MBTI_ITEMS.filter(i => i.dimension === 'IE').forEach(i => {
        rawScores[i.id] = [4, 4, 4];
      });

      const result = calculateMBTIScores(rawScores, false);
      expect(result.traitScores['IE']).toBe(32); // 8*4
      expect(result.traitScores['SN']).toBe(0);  // No items
    });

    it('should average multiple samples', () => {
      const rawScores: Record<string, number[]> = {};
      MBTI_ITEMS.forEach(i => { rawScores[i.id] = [1, 5]; }); // avg = 3

      const result = calculateMBTIScores(rawScores, false);
      // 8 items * 3 = 24 per dimension
      expect(result.traitScores['IE']).toBe(24);
    });
  });

  describe('deriveMBTIFromBigFive', () => {
    it('should derive MBTI type from Big Five results', () => {
      const bigFive: InventoryResult = {
        inventoryName: 'Big Five (IPIP-NEO-120)',
        rawScores: {},
        traitScores: {
          E: 90,   // > 72 -> E
          O: 90,   // > 72 -> N
          A: 90,   // >= 72 -> F
          C: 90,   // >= 72 -> J
          N: 50,
        },
      };

      const result = deriveMBTIFromBigFive(bigFive);
      expect(result.type).toBe('ENFJ');
      expect(result.details.derived).toBe(true);
    });

    it('should derive ISTP for low scores', () => {
      const bigFive: InventoryResult = {
        inventoryName: 'Big Five (IPIP-NEO-120)',
        rawScores: {},
        traitScores: {
          E: 50,   // < 72 -> I
          O: 50,   // < 72 -> S
          A: 50,   // < 72 -> T
          C: 50,   // < 72 -> P
          N: 50,
        },
      };

      const result = deriveMBTIFromBigFive(bigFive);
      expect(result.type).toBe('ISTP');
    });

    it('should have complementary trait scores summing to 144', () => {
      const bigFive: InventoryResult = {
        inventoryName: 'Big Five (IPIP-NEO-120)',
        rawScores: {},
        traitScores: { E: 80, O: 60, A: 90, C: 70, N: 50 },
      };

      const result = deriveMBTIFromBigFive(bigFive);
      expect(result.traitScores['E'] + result.traitScores['I']).toBe(144);
      expect(result.traitScores['N'] + result.traitScores['S']).toBe(144);
      expect(result.traitScores['F'] + result.traitScores['T']).toBe(144);
      expect(result.traitScores['J'] + result.traitScores['P']).toBe(144);
    });

    it('should calculate PSI values between 0 and 1', () => {
      const bigFive: InventoryResult = {
        inventoryName: 'Big Five (IPIP-NEO-120)',
        rawScores: {},
        traitScores: { E: 80, O: 60, A: 90, C: 70, N: 50 },
      };

      const result = deriveMBTIFromBigFive(bigFive);
      Object.values(result.psi!).forEach(v => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      });
    });
  });
});
