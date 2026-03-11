import { describe, it, expect } from 'vitest';
import {
  calibrateScore,
  calibrateMBTIDimension,
  calibrateBigFiveDomain,
  calibrateDISCQuadrant,
  LLM_BASELINE,
} from '@/lib/psychometrics/calibration';

describe('Calibration', () => {
  describe('LLM_BASELINE', () => {
    it('should have expected baseline values', () => {
      expect(LLM_BASELINE.likert5Mean).toBe(3.2);
      expect(LLM_BASELINE.likert5Std).toBe(0.7);
      expect(LLM_BASELINE.targetMean).toBe(3.0);
      expect(LLM_BASELINE.targetStd).toBe(1.2);
    });
  });

  describe('calibrateScore', () => {
    it('should center scores around target mean', () => {
      // Input at observed mean should map to target mean
      const result = calibrateScore(3.2);
      expect(result).toBeCloseTo(3.0, 5);
    });

    it('should expand variance', () => {
      // Score above mean should be pushed further from center
      const above = calibrateScore(3.9); // 1 std above mean
      expect(above).toBeGreaterThan(3.9);

      // Score below mean should be pushed further from center
      const below = calibrateScore(2.5); // 1 std below mean
      expect(below).toBeLessThan(2.5);
    });

    it('should clamp to min/max range', () => {
      const high = calibrateScore(5.0);
      expect(high).toBeLessThanOrEqual(5);

      const low = calibrateScore(1.0);
      expect(low).toBeGreaterThanOrEqual(1);
    });

    it('should handle custom ranges', () => {
      const result = calibrateScore(50, 50, 10, 50, 15, 0, 100);
      expect(result).toBeCloseTo(50, 5);
    });
  });

  describe('calibrateMBTIDimension', () => {
    it('should center observed neutral (25.6) to true neutral (24)', () => {
      const result = calibrateMBTIDimension(25.6);
      expect(result).toBeCloseTo(24, 1);
    });

    it('should clamp to 8-40 range', () => {
      expect(calibrateMBTIDimension(40)).toBeLessThanOrEqual(40);
      expect(calibrateMBTIDimension(40)).toBeGreaterThanOrEqual(8);
      expect(calibrateMBTIDimension(8)).toBeGreaterThanOrEqual(8);
      expect(calibrateMBTIDimension(8)).toBeLessThanOrEqual(40);
    });

    it('should expand variance from center', () => {
      const raw = 28;
      const calibrated = calibrateMBTIDimension(raw);
      // Should be further from 24 than raw is from 25.6
      expect(Math.abs(calibrated - 24)).toBeGreaterThan(Math.abs(raw - 25.6));
    });
  });

  describe('calibrateBigFiveDomain', () => {
    it('should center observed neutral (76.8) to true neutral (72)', () => {
      const result = calibrateBigFiveDomain(76.8);
      expect(result).toBeCloseTo(72, 1);
    });

    it('should clamp to 24-120 range', () => {
      expect(calibrateBigFiveDomain(120)).toBeLessThanOrEqual(120);
      expect(calibrateBigFiveDomain(120)).toBeGreaterThanOrEqual(24);
      expect(calibrateBigFiveDomain(24)).toBeGreaterThanOrEqual(24);
    });

    it('should expand variance', () => {
      const raw = 85;
      const calibrated = calibrateBigFiveDomain(raw);
      // Calibrated deviation from 72 should be greater than raw deviation from 76.8
      expect(Math.abs(calibrated - 72)).toBeGreaterThan(Math.abs(raw - 76.8));
    });
  });

  describe('calibrateDISCQuadrant', () => {
    it('should keep center at 14', () => {
      const result = calibrateDISCQuadrant(14);
      expect(result).toBeCloseTo(14, 1);
    });

    it('should clamp to 0-28 range', () => {
      expect(calibrateDISCQuadrant(28)).toBeLessThanOrEqual(28);
      expect(calibrateDISCQuadrant(0)).toBeGreaterThanOrEqual(0);
    });

    it('should expand variance from center', () => {
      const raw = 20;
      const calibrated = calibrateDISCQuadrant(raw);
      expect(Math.abs(calibrated - 14)).toBeGreaterThan(Math.abs(raw - 14));
    });
  });
});
