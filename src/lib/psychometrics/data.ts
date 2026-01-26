import { supabase } from '@/lib/supabase';
import { ModelProfile } from '@/lib/psychometrics/types';

export async function getModelProfile(modelName: string): Promise<ModelProfile | null> {
    if (!supabase) return null;

    // Fetch all runs for this model
    const { data: runs, error } = await supabase
        .from('runs')
        .select('created_at, results, persona')
        .eq('model_name', modelName)
        .limit(1000);

    if (error || !runs || runs.length === 0) {
        console.error('Error fetching model data:', error);
        return null;
    }

    // --- AGGREGATION LOGIC ---

    // 1. Big Five Aggregation
    const bigFiveTotals: Record<string, number> = { N: 0, E: 0, O: 0, A: 0, C: 0 };
    let bigFiveCount = 0;

    // 2. DISC Aggregation
    const discTotals: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    let discCount = 0;

    // 3. MBTI Counts (for mode) and Trait Aggregation
    const mbtiCounts: Record<string, number> = {};
    const mbtiTotals: Record<string, number> = { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    let mbtiScoreCount = 0;

    // 4. Dark Triad Aggregation
    const darkTriadTotals: Record<string, number> = { Machiavellianism: 0, Narcissism: 0, Psychopathy: 0 };
    let darkTriadCount = 0;

    runs.forEach(run => {
        // Big Five
        const bf = run.results?.bigfive?.traitScores;
        if (bf) {
            Object.keys(bigFiveTotals).forEach(k => bigFiveTotals[k] += (bf[k] || 0));
            bigFiveCount++;
        }

        // DISC
        const disc = run.results?.disc?.traitScores;
        if (disc) {
            Object.keys(discTotals).forEach(k => discTotals[k] += (disc[k] || 0));
            discCount++;
        }

        // MBTI Type Count
        const type = run.results?.mbti?.type || run.results?.mbti_derived?.type;
        if (type) {
            mbtiCounts[type] = (mbtiCounts[type] || 0) + 1;
        }

        // MBTI Scores Aggregation
        const mbtiScores = run.results?.mbti?.traitScores || run.results?.mbti_derived?.traitScores;
        if (mbtiScores) {
            Object.keys(mbtiTotals).forEach(k => {
                if (mbtiScores[k] !== undefined) {
                    mbtiTotals[k] += mbtiScores[k];
                }
            });
            mbtiScoreCount++;
        }

        // Dark Triad
        const dt = run.results?.darktriad?.traitScores;
        if (dt) {
            Object.keys(darkTriadTotals).forEach(k => darkTriadTotals[k] += (dt[k] || 0));
            darkTriadCount++;
        }
    });

    // Compute Averages
    const avgBigFive: Record<string, number> = {};
    if (bigFiveCount > 0) {
        Object.keys(bigFiveTotals).forEach(k => avgBigFive[k] = bigFiveTotals[k] / bigFiveCount);
    }

    const avgDisc: Record<string, number> = {};
    if (discCount > 0) {
        Object.keys(discTotals).forEach(k => avgDisc[k] = discTotals[k] / discCount);
    }

    const avgMbti: Record<string, number> = {};
    if (mbtiScoreCount > 0) {
        Object.keys(mbtiTotals).forEach(k => avgMbti[k] = mbtiTotals[k] / mbtiScoreCount);
    }

    const avgDarkTriad: Record<string, number> = {};
    if (darkTriadCount > 0) {
        Object.keys(darkTriadTotals).forEach(k => avgDarkTriad[k] = darkTriadTotals[k] / darkTriadCount);
    }

    // Find MBTI Mode
    let topMbti = '';
    let maxMbtiCount = 0;
    Object.entries(mbtiCounts).forEach(([type, count]) => {
        if (count > maxMbtiCount) {
            maxMbtiCount = count;
            topMbti = type;
        }
    });

    // Find Persona Mode
    const personaCounts: Record<string, number> = {};
    runs.forEach(run => {
        const p = run.persona || 'Base Model';
        personaCounts[p] = (personaCounts[p] || 0) + 1;
    });

    let topPersona = 'Base Model';
    let maxPersonaCount = 0;
    Object.entries(personaCounts).forEach(([p, count]) => {
        if (count > maxPersonaCount) {
            maxPersonaCount = count;
            topPersona = p;
        }
    });

    // Construct Synthetic Profile
    const syntheticProfile: ModelProfile = {
        modelName: modelName,
        persona: topPersona,
        timestamp: Date.now(),
        results: {}
    };

    if (bigFiveCount > 0) {
        syntheticProfile.results['bigfive'] = {
            inventoryName: 'Big Five (Aggregated)',
            rawScores: {},
            traitScores: avgBigFive,
            details: { count: bigFiveCount }
        };
    }

    if (discCount > 0) {
        syntheticProfile.results['disc'] = {
            inventoryName: 'DISC (Aggregated)',
            rawScores: {},
            traitScores: avgDisc,
            details: { count: discCount }
        };
    }

    if (topMbti) {
        syntheticProfile.results['mbti_derived'] = {
            inventoryName: 'MBTI (Most Frequent)',
            rawScores: {},
            traitScores: avgMbti,
            type: topMbti,
            details: { count: maxMbtiCount, total: runs.length }
        };
    }

    if (darkTriadCount > 0) {
        syntheticProfile.results['darktriad'] = {
            inventoryName: 'Dark Triad (Aggregated)',
            rawScores: {},
            traitScores: avgDarkTriad,
            details: { count: darkTriadCount }
        };
    }

    return syntheticProfile;
}
