import { supabase } from '@/lib/supabase';
import { ResultsView } from '@/components/ResultsView';
import { ModelProfile, InventoryResult } from '@/lib/psychometrics/types';
import Link from 'next/link';

export const revalidate = 0; // Dynamic

export default async function ModelDetailPage(props: { params: Promise<{ model: string }> }) {
    const params = await props.params;
    const modelName = decodeURIComponent(params.model);

    if (!supabase) {
        return <div className="p-8 text-center">Backend not configured.</div>;
    }

    // Fetch all runs for this model
    const { data: runs, error } = await supabase
        .from('runs')
        .select('created_at, results, persona')
        .eq('model_name', modelName);

    if (error) {
        return <div className="p-8 text-center text-red-600">Error loading model data: {error.message}</div>;
    }

    if (!runs || runs.length === 0) {
        return <div className="p-8 text-center">No runs found for model: {modelName}</div>;
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
        // Check both 'mbti' and 'mbti_derived' for scores
        const mbtiScores = run.results?.mbti?.traitScores || run.results?.mbti_derived?.traitScores;
        if (mbtiScores) {
            Object.keys(mbtiTotals).forEach(k => {
                if (mbtiScores[k] !== undefined) {
                    mbtiTotals[k] += mbtiScores[k];
                }
            });
            mbtiScoreCount++;
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
    // We strictly adhere to ModelProfile structure so ResultsView works
    const syntheticProfile: ModelProfile = {
        modelName: `${modelName} (Average)`,
        persona: topPersona, // Add the dominant persona
        timestamp: Date.now(),
        results: {}
    };

    if (bigFiveCount > 0) {
        syntheticProfile.results['bigfive'] = {
            inventoryName: 'Big Five (Aggregated)',
            rawScores: {}, // Not needed for visual
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
        // We need to provide 'type' for SummaryCard
        syntheticProfile.results['mbti_derived'] = {
            inventoryName: 'MBTI (Most Frequent)',
            rawScores: {},
            traitScores: avgMbti, // Use aggregated averages
            type: topMbti,
            details: { count: maxMbtiCount, total: runs.length }
        };
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{modelName}</h1>
                        <p className="text-gray-500">Aggregated results from {runs.length} runs</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/explorer" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            ← Back to Explorer
                        </Link>
                        <Link href={`/runs?search=${encodeURIComponent(modelName)}`} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            View Individual Runs
                        </Link>
                    </div>
                </div>

                {/* Reuse the ResultsView in Read-Only Mode */}
                <ResultsView results={syntheticProfile} readOnly={true} />
            </div>
        </div>
    );
}
