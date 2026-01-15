import { supabase } from '@/lib/supabase';
import { getModelProfile } from '@/lib/psychometrics/data';
import { ResultsView } from '@/components/ResultsView';
import { ModelProfile, InventoryResult } from '@/lib/psychometrics/types';
import Link from 'next/link';
import { Metadata } from 'next';

export const revalidate = 0; // Dynamic

export async function generateMetadata(props: { params: Promise<{ model: string }> }): Promise<Metadata> {
    const params = await props.params;
    const modelName = decodeURIComponent(params.model);

    return {
        title: `${modelName} Personality Profile - AI Psychometrics Lab`,
        description: `Detailed psychometric analysis of ${modelName}. Explore Big Five, DISC, and MBTI personality traits based on aggregated AI runs.`,
        openGraph: {
            title: `${modelName} - AI Personality Analysis`,
            description: `See how ${modelName} scores on Big Five, Dark Triad, and more.`,
        }
    };
}

export default async function ModelDetailPage(props: { params: Promise<{ model: string }> }) {
    const params = await props.params;
    const modelName = decodeURIComponent(params.model);

    if (!supabase) {
        return <div className="p-8 text-center">Backend not configured.</div>;
    }

    const syntheticProfile = await getModelProfile(modelName);

    if (!syntheticProfile) {
        return <div className="p-8 text-center">No runs found for model: {modelName}</div>;
    }

    // Extract count from bigfive details or default to 0 for display
    const runCount = syntheticProfile.results['bigfive']?.details?.count || 0;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{modelName}</h1>
                        <p className="text-gray-500">Aggregated results from {runCount} runs</p>
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
                <ResultsView
                    results={syntheticProfile}
                    readOnly={true}
                    sourceLabel={`explorer/${encodeURIComponent(modelName)}`}
                />
            </div>
        </div>
    );
}
