import { supabase } from '@/lib/supabase';
import { ResultsView } from '@/components/ResultsView';
import Link from 'next/link';

// Do not cache this page to ensure we typically get fresh data, 
// though for a specific ID it might be fine to cache. 
// However, since we might update it or it might be new, revalidate on demand is better.
// For simplicity:
export const revalidate = 60; // Cache for 60 seconds

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: PageProps) {
    if (!supabase) {
        return <div className="p-8 text-center">Backend not configured.</div>;
    }

    const { id } = await params;

    const { data: run, error } = await supabase
        .from('runs')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !run) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Run Not Found</h1>
                <p className="text-gray-600 mb-8">The requested personality profile could not be found.</p>
                <Link href="/runs" className="text-indigo-600 hover:underline">
                    Browse Recent Runs
                </Link>
            </div>
        );
    }

    // Reconstruct ModelProfile from DB data
    const profile = {
        modelName: run.model_name,
        timestamp: new Date(run.created_at).getTime(),
        results: run.results, // Assuming exact shape match
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <Link href="/runs" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Back to Recent Runs
                    </Link>
                    <div className="text-sm text-gray-500">
                        Run ID: {run.id.slice(0, 8)}... • {new Date(run.created_at).toLocaleString()}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{run.model_name}</h1>
                    {run.model_version && <p className="text-gray-600">Version: {run.model_version}</p>}
                </div>

                <ResultsView results={profile} apiKey="" readOnly={true} />
            </div>
        </div>
    );
}
