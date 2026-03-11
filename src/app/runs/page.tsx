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
        <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-screen-xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Recent Runs</h1>
                    <Link href="/" className="min-h-[44px] inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                        {'<- '}Back to Test
                    </Link>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {runs?.map((run) => {
                            const mbti = run.results?.mbti?.type || run.results?.mbti_derived?.type;
                            const disc = run.results?.disc?.traitScores;
                            return (
                                <li key={run.id} className="hover:bg-gray-50 transition">
                                    <Link href={`/runs/${run.id}`} className="block p-4 sm:p-6">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex-shrink-0 min-w-0">
                                                <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 break-words">
                                                    {run.model_name}
                                                    {run.model_version && <span className="text-sm text-gray-500 ml-2">v{run.model_version}</span>}
                                                </h2>
                                                <p className="text-xs text-gray-500 mt-1 break-words">
                                                    {new Date(run.created_at).toLocaleString()}
                                                </p>
                                                {mbti && (
                                                    <span className="mt-2 inline-block px-2 py-0.5 rounded text-sm font-bold bg-indigo-100 text-indigo-800">
                                                        {mbti}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-gray-100">
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                    <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Big Five</div>
                                                    <div className="grid grid-cols-5 gap-1 sm:gap-2">
                                                    {['O', 'C', 'E', 'A', 'N'].map(t => (
                                                            <div key={t} className="text-center">
                                                                <div className="font-bold text-gray-800 text-sm">
                                                                {run.results?.bigfive?.traitScores?.[t]?.toFixed(0) || '-'}
                                                            </div>
                                                                <div className={`text-[10px] font-bold ${t === 'O' ? 'text-blue-500' : t === 'C' ? 'text-green-500' : t === 'E' ? 'text-yellow-500' : t === 'A' ? 'text-purple-500' : 'text-red-500'
                                                                }`}>{t}</div>
                                                            </div>
                                                    ))}
                                                    </div>
                                                </div>

                                                {disc && (
                                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">DISC</div>
                                                        <div className="grid grid-cols-4 gap-1 sm:gap-2">
                                                        {['D', 'I', 'S', 'C'].map(t => (
                                                                <div key={t} className="text-center">
                                                                <div className="font-bold text-gray-700 text-sm">
                                                                    {disc[t]?.toFixed(0) || '-'}
                                                                </div>
                                                                <div className={`text-[10px] font-bold ${t === 'D' ? 'text-red-500' : t === 'I' ? 'text-yellow-500' : t === 'S' ? 'text-green-500' : 'text-blue-500'
                                                                    }`}>{t}</div>
                                                                </div>
                                                        ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {run.results?.darktriad?.traitScores && (
                                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Dark Triad</div>
                                                        <div className="grid grid-cols-3 gap-1 sm:gap-2">
                                                        {['Machiavellianism', 'Narcissism', 'Psychopathy'].map(t => (
                                                                <div key={t} className="text-center">
                                                                <div className="font-bold text-gray-800 text-sm">
                                                                    {run.results?.darktriad?.traitScores?.[t]?.toFixed(0) || '-'}
                                                                </div>
                                                                <div className={`text-[10px] font-bold ${t === 'Machiavellianism' ? 'text-blue-900' : t === 'Narcissism' ? 'text-purple-800' : 'text-red-900'
                                                                    }`}>
                                                                    {t[0]}
                                                                </div>
                                                                </div>
                                                        ))}
                                                        </div>
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


