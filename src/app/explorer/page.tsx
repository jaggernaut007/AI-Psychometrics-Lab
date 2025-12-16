import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export const revalidate = 60; // Cache for 60 seconds

export default async function LeaderboardPage() {
    if (!supabase) {
        return <div className="p-8 text-center">Backend not configured.</div>;
    }

    // Since we don't have a sophisticated aggregation query pre-built, and Supabase JS client doesn't do complex GROUP BY easily without views or RPC,
    // we will fetch all runs (limit 1000) and aggregate in memory for this MVP.
    // For a production app, we would create a Database View.

    // Fetch relevant fields only
    const { data: runs, error } = await supabase
        .from('runs')
        .select('model_name, persona, results') // Added persona
        .limit(1000); // Reasonable limit for MVP

    if (error) {
        return <div className="p-8 text-center text-red-600">Error loading leaderboard: {error.message}</div>;
    }

    // Aggregate
    const modelStats: Record<string, {
        modelName: string;
        persona: string;
        count: number;
        bigFive: Record<string, number>;
        disc: Record<string, number>;
        mbtiCounts: Record<string, number>;
    }> = {};

    runs?.forEach(run => {
        const name = run.model_name;
        // Default to 'Base Model' if null (legacy runs)
        const persona = run.persona || 'Base Model';

        // Key is combination
        const key = `${name}::${persona}`;

        if (!modelStats[key]) {
            modelStats[key] = {
                modelName: name,
                persona: persona,
                count: 0,
                bigFive: { N: 0, E: 0, O: 0, A: 0, C: 0 },
                disc: { D: 0, I: 0, S: 0, C: 0 },
                mbtiCounts: {}
            };
        }

        const stats = modelStats[key];
        stats.count++;

        // Big Five
        const bigFiveScores = run.results?.bigfive?.traitScores;
        if (bigFiveScores) {
            ['N', 'E', 'O', 'A', 'C'].forEach(key => {
                stats.bigFive[key] += (bigFiveScores[key] || 0);
            });
        }

        // DISC
        const discScores = run.results?.disc?.traitScores;
        if (discScores) {
            ['D', 'I', 'S', 'C'].forEach(key => {
                stats.disc[key] += (discScores[key] || 0);
            });
        }

        // MBTI
        const mbtiType = run.results?.mbti?.type || run.results?.mbti_derived?.type;
        if (mbtiType) {
            stats.mbtiCounts[mbtiType] = (stats.mbtiCounts[mbtiType] || 0) + 1;
        }
    });

    // Compute averages
    const leaderboard = Object.values(modelStats).map((stats) => {
        const avgScores: Record<string, number> = {};
        ['N', 'E', 'O', 'A', 'C'].forEach(key => {
            avgScores[key] = stats.bigFive[key] / stats.count;
        });

        const avgDisc: Record<string, number> = {};
        ['D', 'I', 'S', 'C'].forEach(key => {
            avgDisc[key] = stats.disc[key] / stats.count;
        });

        // Find most frequent MBTI
        let topMbti = '-';
        let maxCount = 0;
        Object.entries(stats.mbtiCounts).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topMbti = type;
            }
        });

        return {
            id: stats.modelName + '::' + stats.persona,
            name: stats.modelName,
            persona: stats.persona, // Pass persona to component
            count: stats.count,
            scores: avgScores,
            disc: avgDisc,
            mbti: topMbti
        };
    }).sort((a, b) => b.count - a.count);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Model Explorer</h1>
                        <p className="mt-2 text-lg text-gray-600">Discover and compare personality profiles across {runs?.length} runs.</p>
                    </div>
                    <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm">
                        + New Test
                    </Link>
                </div>

                <LeaderboardTable data={leaderboard} />
            </div>
        </div>
    );
}
