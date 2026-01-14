import React from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Still needed for the specific not-found UI
import { CompareClientView } from '@/components/CompareClientView'; // Import the new client view


interface PageProps {
    searchParams: Promise<{ ids?: string }>;
}


export const revalidate = 60;

export default async function ComparePage({ searchParams }: PageProps) {
    const { ids } = await searchParams;

    if (!ids) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">No models selected</h2>
                    <Link href="/explorer" className="text-blue-600 hover:underline mt-2 inline-block">
                        Go back to Explorer
                    </Link>
                </div>
            </div>
        );
    }

    const selectedIds = ids.split(',').map(decodeURIComponent);

    if (!supabase) {
        return <div className="p-8 text-center text-red-600">Backend not configured (Supabase client is null).</div>;
    }

    // 1. Fetch ALL runs (MVP approach, same as Explorer)
    // We filter in memory because of the complex aggregation logic required
    // and the lack of a pre-aggregated view.
    const { data: runs, error } = await supabase
        .from('runs')
        .select('model_name, persona, results')
        .limit(2000);

    if (error || !runs) {
        return <div>Error loading data: {error?.message}</div>;
    }

    // 2. Aggregate Data
    const modelStats: Record<string, any> = {};

    runs.forEach(run => {
        const name = run.model_name;
        const persona = run.persona || 'Base Model';
        const key = `${name}::${persona}`;

        // Only process if this key is in our selected IDs
        if (!selectedIds.includes(key)) return;

        if (!modelStats[key]) {
            modelStats[key] = {
                id: key,
                modelName: name,
                persona: persona,
                count: 0,
                bigFive: { N: 0, E: 0, O: 0, A: 0, C: 0 },
                disc: { D: 0, I: 0, S: 0, C: 0 },
                darkTriad: { Machiavellianism: 0, Narcissism: 0, Psychopathy: 0 },
                darkTriadCount: 0,
                mbtiDirectCounts: {},
                mbtiDerivedCounts: {}
            };
        }

        const stats = modelStats[key];
        stats.count++;

        // Big Five
        const bigFiveScores = run.results?.bigfive?.traitScores;
        if (bigFiveScores) {
            ['N', 'E', 'O', 'A', 'C'].forEach(k => {
                stats.bigFive[k] += (bigFiveScores[k] || 0);
            });
        }

        // DISC
        const discScores = run.results?.disc?.traitScores;
        if (discScores) {
            ['D', 'I', 'S', 'C'].forEach(k => {
                stats.disc[k] += (discScores[k] || 0);
            });
        }

        // Dark Triad
        const dtScores = run.results?.darktriad?.traitScores;
        if (dtScores) {
            stats.darkTriadCount++;
            ['Machiavellianism', 'Narcissism', 'Psychopathy'].forEach(k => {
                stats.darkTriad[k] += (dtScores[k] || 0);
            });
        }

        // MBTI
        const directMbti = run.results?.mbti?.type;
        const derivedMbti = run.results?.mbti_derived?.type;
        if (directMbti) {
            stats.mbtiDirectCounts[directMbti] = (stats.mbtiDirectCounts[directMbti] || 0) + 1;
        } else if (derivedMbti) {
            stats.mbtiDerivedCounts[derivedMbti] = (stats.mbtiDerivedCounts[derivedMbti] || 0) + 1;
        }
    });

    // 3. Finalize Averages
    const comparisonModels = Object.values(modelStats).map((stats: any) => {
        const avgScores: Record<string, number> = {};
        ['N', 'E', 'O', 'A', 'C'].forEach(key => {
            // Fix: Ensure we don't divide by zero if count is somehow 0 (unlikely here)
            avgScores[key] = stats.count ? stats.bigFive[key] / stats.count : 0;
        });

        const avgDisc: Record<string, number> = {};
        ['D', 'I', 'S', 'C'].forEach(key => {
            avgDisc[key] = stats.count ? stats.disc[key] / stats.count : 0;
        });

        const avgDarkTriad: Record<string, number> = {};
        if (stats.darkTriadCount > 0) {
            ['Machiavellianism', 'Narcissism', 'Psychopathy'].forEach(key => {
                avgDarkTriad[key] = stats.darkTriad[key] / stats.darkTriadCount;
            });
        }

        // Majority MBTI
        let topMbti = '-';
        let maxCount = 0;
        const hasDirect = Object.keys(stats.mbtiDirectCounts).length > 0;
        const countsToUse = hasDirect ? stats.mbtiDirectCounts : stats.mbtiDerivedCounts;
        Object.entries(countsToUse).forEach(([type, count]) => {
            if ((count as number) > maxCount) {
                maxCount = count as number;
                topMbti = type;
            }
        });

        return {
            id: stats.id,
            name: stats.modelName,
            persona: stats.persona,
            scores: avgScores,
            disc: avgDisc,
            darkTriad: avgDarkTriad,
            mbti: topMbti,
            count: stats.count
        };
    });

    // Sort to match the order of IDs selected
    comparisonModels.sort((a, b) => selectedIds.indexOf(a.id) - selectedIds.indexOf(b.id));

    // Render the Client Component
    return <CompareClientView comparisonModels={comparisonModels} />;
}
