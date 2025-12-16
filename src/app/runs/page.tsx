import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export const revalidate = 0; // Dynamic, no cache

export default async function RunsPage(props: { searchParams: Promise<{ search?: string }> }) {
    const searchParams = await props.searchParams;
    const search = searchParams?.search;

    if (!supabase) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Recent Runs</h1>
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded border border-yellow-200">
                    Supabase connection not configured. Please see instructions to set up the backend.
                </div>
            </div>
        );
    }

    let query = supabase
        .from('runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (search) {
        query = query.ilike('model_name', `%${decodeURIComponent(search)}%`);
    }

    const { data: runs, error } = await query;

    if (error) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Recent Runs</h1>
                <div className="p-4 bg-red-50 text-red-800 rounded border border-red-200">
                    Error loading runs: {error.message}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Recent Runs</h1>
                    <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        ← Back to Test
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {runs?.map((run) => {
                            const mbti = run.results?.mbti?.type || run.results?.mbti_derived?.type;
                            const disc = run.results?.disc?.traitScores;
                            return (
                                <li key={run.id} className="hover:bg-gray-50 transition">
                                    <Link href={`/runs/${run.id}`} className="block p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Left: Model Info */}
                                            <div className="flex-shrink-0">
                                                <h2 className="text-xl font-semibold text-indigo-600">
                                                    {run.model_name}
                                                    {run.model_version && <span className="text-sm text-gray-500 ml-2">v{run.model_version}</span>}
                                                </h2>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(run.created_at).toLocaleString()}
                                                </p>
                                                {mbti && (
                                                    <span className="mt-2 inline-block px-2 py-0.5 rounded text-sm font-bold bg-indigo-100 text-indigo-800">
                                                        {mbti}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Right: Scores */}
                                            <div className="flex flex-wrap items-center gap-6">
                                                {/* Big Five Mini */}
                                                <div className="flex gap-2">
                                                    {['O', 'C', 'E', 'A', 'N'].map(t => (
                                                        <div key={t} className="text-center w-8">
                                                            <div className="font-bold text-gray-800 text-sm">
                                                                {run.results?.bigfive?.traitScores?.[t]?.toFixed(0) || '-'}
                                                            </div>
                                                            <div className={`text-[10px] font-bold ${t === 'O' ? 'text-blue-500' : t === 'C' ? 'text-green-500' : t === 'E' ? 'text-yellow-500' : t === 'A' ? 'text-purple-500' : 'text-red-500'
                                                                }`}>{t}</div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* DISC Mini (if present) */}
                                                {disc && (
                                                    <div className="flex gap-2 border-l pl-4 border-gray-200">
                                                        {['D', 'I', 'S', 'C'].map(t => (
                                                            <div key={t} className="text-center w-8">
                                                                <div className="font-bold text-gray-700 text-sm">
                                                                    {disc[t]?.toFixed(0) || '-'}
                                                                </div>
                                                                <div className={`text-[10px] font-bold ${t === 'D' ? 'text-red-500' : t === 'I' ? 'text-yellow-500' : t === 'S' ? 'text-green-500' : 'text-blue-500'
                                                                    }`}>{t}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    {runs?.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            No runs recorded yet. Be the first to submit one!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
