/**
 * Calibration module for psychometric scoring.
 * @author Gordon Olson, Shreyas Jagannath
 *
 * LLMs tend to give "neutral" or "agreeable" responses (scores clustering around 3 on a 1-5 scale).
 * This module provides functions to:
 * 1. CENTER: Remove the observed LLM bias (shift distribution)
 * 2. EXPAND: Amplify small deviations from neutral to more clearly distinguish personality traits
 */

export const LLM_BASELINE = {
    likert5Mean: 3.2,
    likert5Std: 0.7,
    targetMean: 3.0,
    targetStd: 1.2,
};

export function calibrateScore(
    rawScore: number,
    observedMean: number = LLM_BASELINE.likert5Mean,
    observedStd: number = LLM_BASELINE.likert5Std,
    targetMean: number = LLM_BASELINE.targetMean,
    targetStd: number = LLM_BASELINE.targetStd,
    minValue: number = 1,
    maxValue: number = 5
): number {
    const zScore = (rawScore - observedMean) / observedStd;
    const calibrated = zScore * targetStd + targetMean;
    return Math.max(minValue, Math.min(maxValue, calibrated));
}

export function calibrateMBTIDimension(rawDimensionScore: number): number {
    const observedMean = 25.6;
    const observedStd = 3.5;
    const targetMean = 24;
    const targetStd = 5.0;
    return calibrateScore(rawDimensionScore, observedMean, observedStd, targetMean, targetStd, 8, 40);
}

export function calibrateBigFiveDomain(rawDomainScore: number): number {
    const observedMean = 76.8;
    const observedStd = 8.0;
    const targetMean = 72;
    const targetStd = 14.0;
    return calibrateScore(rawDomainScore, observedMean, observedStd, targetMean, targetStd, 24, 120);
}

export function calibrateDISCQuadrant(rawQuadrantScore: number): number {
    const observedMean = 14;
    const observedStd = 3.5;
    const targetMean = 14;
    const targetStd = 5.5;
    return calibrateScore(rawQuadrantScore, observedMean, observedStd, targetMean, targetStd, 0, 28);
}
