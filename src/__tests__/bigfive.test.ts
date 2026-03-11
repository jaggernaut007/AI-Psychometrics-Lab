import { describe, it, expect } from 'vitest';
import { calculateBigFiveScores, BIG_FIVE_ITEMS } from '@/lib/psychometrics/inventories/bigfive';

describe('Big Five Inventory', () => {
  describe('BIG_FIVE_ITEMS', () => {
    it('should have exactly 120 items', () => {
      expect(BIG_FIVE_ITEMS).toHaveLength(120);
    });

    it('should have unique IDs', () => {
      const ids = BIG_FIVE_ITEMS.map(i => i.id);
      expect(new Set(ids).size).toBe(120);
    });

    it('should have all items typed as likert_5', () => {
      expect(BIG_FIVE_ITEMS.every(i => i.type === 'likert_5')).toBe(true);
    });

    it('should have 30 facets (5 domains x 6 facets)', () => {
      const facets = new Set(BIG_FIVE_ITEMS.map(i => i.category));
      expect(facets.size).toBe(30);
    });

    it('should have 4 items per facet', () => {
      const facetCounts: Record<string, number> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        const cat = i.category!;
        facetCounts[cat] = (facetCounts[cat] || 0) + 1;
      });
      Object.entries(facetCounts).forEach(([facet, count]) => {
        expect(count, `Facet ${facet} should have 4 items`).toBe(4);
      });
    });

    it('should have 24 items per domain', () => {
      const domainCounts: Record<string, number> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        const domain = i.category!.charAt(0);
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
      ['N', 'E', 'O', 'A', 'C'].forEach(d => {
        expect(domainCounts[d], `Domain ${d} should have 24 items`).toBe(24);
      });
    });

    it('should have keyed as plus or minus for all items', () => {
      BIG_FIVE_ITEMS.forEach(i => {
        expect(['plus', 'minus']).toContain(i.keyed);
      });
    });
  });

  describe('calculateBigFiveScores', () => {
    it('should return correct structure', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [3, 3, 3, 3, 3];
      });

      const result = calculateBigFiveScores(rawScores);
      expect(result.inventoryName).toBe('Big Five (IPIP-NEO-120)');
      expect(result.rawScores).toBe(rawScores);
      expect(result.traitScores).toBeDefined();
    });

    it('should calculate facet scores', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [3, 3, 3, 3, 3];
      });

      const result = calculateBigFiveScores(rawScores, false);
      // For all-3 responses, plus-keyed items contribute 3, minus-keyed contribute 6-3=3
      // Each facet has 4 items, so facet score = 4 * 3 = 12
      expect(result.traitScores['N1']).toBe(12);
      expect(result.traitScores['E1']).toBe(12);
      expect(result.traitScores['O1']).toBe(12);
    });

    it('should calculate domain scores as sum of 6 facets', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [3, 3, 3, 3, 3];
      });

      const result = calculateBigFiveScores(rawScores, false);
      // Each domain = 6 facets * 12 = 72
      expect(result.traitScores['N']).toBe(72);
      expect(result.traitScores['E']).toBe(72);
      expect(result.traitScores['O']).toBe(72);
      expect(result.traitScores['A']).toBe(72);
      expect(result.traitScores['C']).toBe(72);
    });

    it('should handle reverse coding correctly', () => {
      const rawScores: Record<string, number[]> = {};
      // Set all to 5 (strongly agree)
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [5];
      });

      const result = calculateBigFiveScores(rawScores, false);
      // Plus-keyed: 5, Minus-keyed: 6-5=1
      // Check a facet with known mix of plus/minus items
      // N1 items: ids 1,31,61,91 - all plus-keyed -> 4*5 = 20
      expect(result.traitScores['N1']).toBe(20);

      // A2 items: ids 9,39,69,99 - all minus-keyed -> 4*(6-5) = 4
      expect(result.traitScores['A2']).toBe(4);
    });

    it('should average multiple samples per item', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [1, 5]; // average = 3
      });

      const result = calculateBigFiveScores(rawScores, false);
      // Same as all-3 scenario
      expect(result.traitScores['N']).toBe(72);
    });

    it('should handle missing items gracefully', () => {
      // Only provide scores for N items
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.filter(i => i.category?.startsWith('N')).forEach(i => {
        rawScores[i.id] = [3, 3, 3];
      });

      const result = calculateBigFiveScores(rawScores, false);
      expect(result.traitScores['N']).toBe(72);
      // Other domains should be 0 (no items provided)
      expect(result.traitScores['E']).toBe(0);
    });

    it('should handle empty scores array', () => {
      const rawScores: Record<string, number[]> = { '1': [] };
      const result = calculateBigFiveScores(rawScores, false);
      // Should not crash, items with empty arrays are skipped
      expect(result).toBeDefined();
    });

    it('should store raw domain scores when calibration is enabled', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [3, 3, 3, 3, 3];
      });

      const result = calculateBigFiveScores(rawScores, true);
      expect(result.traitScores['_raw_N']).toBe(72);
      expect(result.traitScores['_raw_E']).toBe(72);
      expect(result.details.calibrated).toBe(true);
    });

    it('should produce higher scores for all-5 plus-keyed domain', () => {
      const rawScores: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores[i.id] = [5];
      });
      const high = calculateBigFiveScores(rawScores, false);

      const rawScores2: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => {
        rawScores2[i.id] = [1];
      });
      const low = calculateBigFiveScores(rawScores2, false);

      // For N (all plus-keyed facets): all-5 should be higher than all-1
      expect(high.traitScores['N']).toBeGreaterThan(low.traitScores['N']);
    });

    it('should produce domain scores in valid range (24-120) without calibration', () => {
      // Extreme high
      const rawHigh: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => { rawHigh[i.id] = [5]; });
      const high = calculateBigFiveScores(rawHigh, false);

      // Extreme low
      const rawLow: Record<string, number[]> = {};
      BIG_FIVE_ITEMS.forEach(i => { rawLow[i.id] = [1]; });
      const low = calculateBigFiveScores(rawLow, false);

      ['N', 'E', 'O', 'A', 'C'].forEach(d => {
        expect(high.traitScores[d]).toBeGreaterThanOrEqual(24);
        expect(high.traitScores[d]).toBeLessThanOrEqual(120);
        expect(low.traitScores[d]).toBeGreaterThanOrEqual(24);
        expect(low.traitScores[d]).toBeLessThanOrEqual(120);
      });
    });
  });
});
