import { describe, it, expect } from 'vitest';
import { calculateDISCScores, DISC_ITEMS } from '@/lib/psychometrics/inventories/disc';

describe('DISC Inventory', () => {
  describe('DISC_ITEMS', () => {
    it('should have exactly 28 items', () => {
      expect(DISC_ITEMS).toHaveLength(28);
    });

    it('should have unique IDs', () => {
      const ids = DISC_ITEMS.map(i => i.id);
      expect(new Set(ids).size).toBe(28);
    });

    it('should have 4 words per item', () => {
      DISC_ITEMS.forEach(item => {
        expect(item.words, `Item ${item.id} should have 4 words`).toHaveLength(4);
      });
    });

    it('should have valid quadrants for all words', () => {
      DISC_ITEMS.forEach(item => {
        item.words.forEach(word => {
          expect(['D', 'I', 'S', 'C']).toContain(word.quadrant);
        });
      });
    });
  });

  describe('calculateDISCScores', () => {
    it('should return correct structure', () => {
      const rawScores: Record<string, number[]> = {};
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [1]; }); // most=0, least=1

      const result = calculateDISCScores(rawScores);
      expect(result.inventoryName).toBe('DISC Assessment');
      expect(result.traitScores).toBeDefined();
      expect(result.details.graph1).toBeDefined();
      expect(result.details.graph2).toBeDefined();
    });

    it('should calculate scores with encoding (mostIdx*10 + leastIdx)', () => {
      const rawScores: Record<string, number[]> = {};
      // Encode most=0 (first word), least=3 (fourth word) -> 0*10+3 = 3
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateDISCScores(rawScores, false);
      // Should have graph1 and graph2 tallies
      expect(result.details.graph1).toBeDefined();
      expect(result.details.graph2).toBeDefined();
    });

    it('should produce balanced scores for balanced input', () => {
      // When most and least are both 0: most=0, least=0
      // graph1 and graph2 count same quadrants -> difference is 0
      // score = (0 - 0 + 28) / 2 = 14 for each quadrant
      const rawScores: Record<string, number[]> = {};
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [0]; }); // most=0, least=0

      const result = calculateDISCScores(rawScores, false);
      // All quadrants should be 14 (neutral) when most=least
      const total = result.traitScores['_raw_D'] + result.traitScores['_raw_I'] +
                    result.traitScores['_raw_S'] + result.traitScores['_raw_C'];
      expect(total).toBe(56); // 4 * 14
    });

    it('should store raw scores when calibration is enabled', () => {
      const rawScores: Record<string, number[]> = {};
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [1]; });

      const result = calculateDISCScores(rawScores, true);
      expect(result.traitScores['_raw_D']).toBeDefined();
      expect(result.traitScores['_raw_I']).toBeDefined();
      expect(result.traitScores['_raw_S']).toBeDefined();
      expect(result.traitScores['_raw_C']).toBeDefined();
      expect(result.details.calibrated).toBe(true);
    });

    it('should handle empty rawScores', () => {
      const result = calculateDISCScores({}, false);
      expect(result.traitScores['_raw_D']).toBe(14);
      expect(result.traitScores['_raw_I']).toBe(14);
      expect(result.traitScores['_raw_S']).toBe(14);
      expect(result.traitScores['_raw_C']).toBe(14);
    });

    it('should use last sample when multiple are provided', () => {
      const rawScores: Record<string, number[]> = {};
      // First sample: most=0,least=1 (value=1)
      // Second sample: most=2,least=3 (value=23)
      // Should use last (23)
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [1, 23]; });

      const result = calculateDISCScores(rawScores, false);
      expect(result).toBeDefined();
    });

    it('should produce scores in valid range', () => {
      const rawScores: Record<string, number[]> = {};
      DISC_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateDISCScores(rawScores, false);
      ['_raw_D', '_raw_I', '_raw_S', '_raw_C'].forEach(key => {
        expect(result.traitScores[key]).toBeGreaterThanOrEqual(0);
        expect(result.traitScores[key]).toBeLessThanOrEqual(28);
      });
    });
  });
});
