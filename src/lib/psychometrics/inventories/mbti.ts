import { InventoryResult } from '../types';

// Derives MBTI type from Big Five (IPIP-NEO-120) scores.
// Mapping based on McCrae & Costa (1989):
// Extraversion -> E (High) / I (Low)
// Openness -> N (High) / S (Low)
// Agreeableness -> F (High) / T (Low)
// Conscientiousness -> J (High) / P (Low)
// Neuroticism -> Not used in MBTI
export function deriveMBTIFromBigFive(bigFiveResults: InventoryResult): InventoryResult {
    const scores = bigFiveResults.traitScores; // Expects domain scores 'E', 'O', 'A', 'C' (24-120 range)

    // Midpoint is 72 ( (24+120)/2 )
    const MIDPOINT = 72;

    const eScore = scores['E'] || MIDPOINT;
    const oScore = scores['O'] || MIDPOINT;
    const aScore = scores['A'] || MIDPOINT;
    const cScore = scores['C'] || MIDPOINT;

    // Calculate PSI (Distance from midpoint normalized)
    // Range is 24-120, so max delta is 48. PSI = delta / 48.
    const MAX_DELTA = 48;

    const psi = {
        IE: Math.abs(eScore - MIDPOINT) / MAX_DELTA,
        SN: Math.abs(oScore - MIDPOINT) / MAX_DELTA,
        TF: Math.abs(aScore - MIDPOINT) / MAX_DELTA,
        JP: Math.abs(cScore - MIDPOINT) / MAX_DELTA,
    };

    const type =
        (eScore >= MIDPOINT ? 'E' : 'I') +
        (oScore >= MIDPOINT ? 'N' : 'S') +
        (aScore >= MIDPOINT ? 'F' : 'T') +
        (cScore >= MIDPOINT ? 'J' : 'P');

    // Create a synthetic traitScores object for the view
    // We map the Big Five score to the dominant pole
    const traitScores = {
        // Map 24-120 to a relative strength.
        E: eScore, I: 144 - eScore, // 144 is 24+120. If E=120, I=24.
        N: oScore, S: 144 - oScore,
        F: aScore, T: 144 - aScore,
        J: cScore, P: 144 - cScore,
    };

    return {
        inventoryName: "MBTI (Derived from Big Five)",
        rawScores: {}, // No direct raw scores
        traitScores,
        type,
        psi,
        details: { derived: true, source: "IPIP-NEO-120" }
    };
}
