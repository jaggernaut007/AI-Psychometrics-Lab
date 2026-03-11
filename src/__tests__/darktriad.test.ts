import { describe, it, expect } from 'vitest';
import { calculateDarkTriadScores, DARK_TRIAD_ITEMS } from '@/lib/psychometrics/inventories/darktriad';

describe('Dark Triad Inventory', () => {
  describe('DARK_TRIAD_ITEMS', () => {
    it('should have exactly 27 items (9 per subscale)', () => {
      expect(DARK_TRIAD_ITEMS).toHaveLength(27);
    });

    it('should have 9 Machiavellianism items', () => {
      const count = DARK_TRIAD_ITEMS.filter(i => i.category === 'Machiavellianism').length;
      expect(count).toBe(9);
    });

    it('should have 9 Narcissism items', () => {
      const count = DARK_TRIAD_ITEMS.filter(i => i.category === 'Narcissism').length;
      expect(count).toBe(9);
    });

    it('should have 9 Psychopathy items', () => {
      const count = DARK_TRIAD_ITEMS.filter(i => i.category === 'Psychopathy').length;
      expect(count).toBe(9);
    });

    it('should have unique IDs', () => {
      const ids = DARK_TRIAD_ITEMS.map(i => i.id);
      expect(new Set(ids).size).toBe(27);
    });

    it('should have some reverse-coded items', () => {
      const minusItems = DARK_TRIAD_ITEMS.filter(i => i.keyed === 'minus');
      expect(minusItems.length).toBeGreaterThan(0);
    });
  });

  describe('calculateDarkTriadScores', () => {
    it('should return correct structure', () => {
      const rawScores: Record<string, number[]> = {};
      DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateDarkTriadScores(rawScores);
      expect(result.inventoryName).toBe('darktriad');
      expect(result.traitScores['Machiavellianism']).toBeDefined();
      expect(result.traitScores['Narcissism']).toBeDefined();
      expect(result.traitScores['Psychopathy']).toBeDefined();
    });

    it('should produce 0 for all-1 responses (minimum)', () => {
      const rawScores: Record<string, number[]> = {};
      DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [1]; });

      const result = calculateDarkTriadScores(rawScores);
      // Plus-keyed: avg=1, (1-1)*25 = 0
      // Minus-keyed: avg=6-1=5, but the subscale average still considers all items
      // For Machiavellianism (all plus-keyed): avg=1, score=0
      expect(result.traitScores['Machiavellianism']).toBe(0);
    });

    it('should produce 100 for all-5 responses on plus-keyed-only subscale', () => {
      const rawScores: Record<string, number[]> = {};
      DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [5]; });

      const result = calculateDarkTriadScores(rawScores);
      // Machiavellianism has all plus-keyed items
      // avg=5, (5-1)*25 = 100
      expect(result.traitScores['Machiavellianism']).toBe(100);
    });

    it('should handle reverse coding', () => {
      // DT-N2 is minus-keyed (category: Narcissism)
      const rawScores: Record<string, number[]> = {};
      DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [3]; });

      const result = calculateDarkTriadScores(rawScores);
      // For all-3: plus items avg=3, minus items avg=6-3=3
      // Overall avg=3, score=(3-1)*25 = 50
      expect(result.traitScores['Narcissism']).toBe(50);
      expect(result.traitScores['Psychopathy']).toBe(50);
    });

    it('should produce scores between 0 and 100', () => {
      // Test with various values
      for (const val of [1, 2, 3, 4, 5]) {
        const rawScores: Record<string, number[]> = {};
        DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [val]; });

        const result = calculateDarkTriadScores(rawScores);
        Object.values(result.traitScores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should handle missing items gracefully', () => {
      const rawScores: Record<string, number[]> = {};
      // Only Machiavellianism items
      DARK_TRIAD_ITEMS.filter(i => i.category === 'Machiavellianism').forEach(i => {
        rawScores[i.id] = [4];
      });

      const result = calculateDarkTriadScores(rawScores);
      expect(result.traitScores['Machiavellianism']).toBe(75); // (4-1)*25
      // Others should be 0 (no items counted -> 0/0 stays 0)
      expect(result.traitScores['Narcissism']).toBe(0);
      expect(result.traitScores['Psychopathy']).toBe(0);
    });

    it('should average multiple samples', () => {
      const rawScores: Record<string, number[]> = {};
      DARK_TRIAD_ITEMS.forEach(i => { rawScores[i.id] = [1, 5]; }); // avg = 3

      const result = calculateDarkTriadScores(rawScores);
      expect(result.traitScores['Machiavellianism']).toBe(50);
    });
  });
});
