"use client";

import React, { useRef, useState } from 'react';
import { saveRun } from '@/app/actions';
import { ModelProfile } from '../lib/psychometrics/types';
import { Share2, Download, Twitter, Linkedin, Facebook, Instagram, Link as LinkIcon } from 'lucide-react';
import { BIG_FIVE_DEFINITIONS } from '../lib/psychometrics/definitions';
import { SummaryCard } from './SummaryCard';

import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

interface ResultsViewProps {
    results: ModelProfile;
    apiKey?: string; // Made optional
    readOnly?: boolean;
    sourceLabel?: string;
}

export function ResultsView({ results, apiKey = '', readOnly = false, sourceLabel }: ResultsViewProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showShareModal, setShowShareModal] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);

    const handleSaveRun = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            const result = await saveRun(results);
            if (result.success) {
                setSaveStatus('success');
            } else {
                setSaveStatus('error');
                if (result.error === 'Supabase is not configured') {
                    alert('Backend database is not configured. Run saved locally only.');
                }
            }
        } catch (err) {
            console.error(err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const generateImageBlob = async () => {
        if (!summaryRef.current) return null;
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const htmlToImage = await import('html-to-image');
            const blob = await htmlToImage.toBlob(summaryRef.current, {
                backgroundColor: '#050B14',
                pixelRatio: 2,
                cacheBust: true,
            });
            return blob;
        } catch (err) {
            console.error("Failed to generate image blob:", err);
            return null;
        }
    };

    const handleDownloadImage = async () => {
        if (!summaryRef.current) return;
        setIsGenerating(true);
        try {
            const blob = await generateImageBlob();
            if (!blob) throw new Error("Blob generation failed");

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${results.modelName.replace(/\s+/g, '_')}_profile.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to generate image:", err);
            alert("Failed to generate image. See console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareClick = async () => {
        // Always open the custom modal as requested
        setShowShareModal(true);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(console.error);
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Construct rich share text
    const mbtiResult = results.results['mbti'] || results.results['mbti_derived'];
    const bigFiveResult = results.results['bigfive'];
    const discResult = results.results['disc'];

    let details = [];
    if (results.persona) details.push(`Type: ${results.persona}`);
    if (mbtiResult) details.push(`MBTI: ${mbtiResult.type}`);
    if (bigFiveResult) {
        const b5 = bigFiveResult.traitScores;
        // OCEAN order roughly
        details.push(`Big 5: O:${b5.O?.toFixed(0)} C:${b5.C?.toFixed(0)} E:${b5.E?.toFixed(0)} A:${b5.A?.toFixed(0)} N:${b5.N?.toFixed(0)}`);
    }
    if (discResult) {
        const d = discResult.traitScores;
        details.push(`DISC: D:${Number(d.D).toFixed(0)} I:${Number(d.I).toFixed(0)} S:${Number(d.S).toFixed(0)} C:${Number(d.C).toFixed(0)}`);
    }

    const shareText = `Psychometric Profile for ${results.modelName}\n${details.join('\n')}`;
    const clipboardText = `${shareText}\n\n${shareUrl}`;

    const bigFive = results.results['bigfive'];

    // Domains: N, E, O, A, C
    const domains = ['Neuroticism', 'Extraversion', 'Openness', 'Agreeableness', 'Conscientiousness'];
    const domainKeys = ['N', 'E', 'O', 'A', 'C'];

    const data = bigFive ? {
        labels: domains,
        datasets: [
            {
                label: results.modelName,
                data: domainKeys.map(key => bigFive.traitScores[key] || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
            },
        ],
    } : null;

    const options = {
        scales: {
            r: {
                min: 24,
                max: 120,
                ticks: {
                    stepSize: 20,
                },
            },
        },
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6 relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Psychometric Profile</h2>

            {bigFive && data && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Big Five Overview</h3>
                            <div className="h-64 w-full">
                                <Radar data={data} options={options} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-gray-700">Detailed Scores</h3>
                            <div className="space-y-2">
                                {domainKeys.map((key, idx) => (
                                    <div key={key} className="flex justify-between items-center border-b border-gray-100 py-2">
                                        <span className="font-medium text-gray-600">{domains[idx]} ({key})</span>
                                        <span className="font-bold text-gray-900">{bigFive.traitScores[key]?.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Trait Interpretations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {domainKeys.map((key) => {
                                const score = bigFive.traitScores[key] || 0;
                                const def = BIG_FIVE_DEFINITIONS[key];

                                let level: 'High' | 'Medium' | 'Low' = 'Medium';
                                let description = def.medium;
                                let colorClass = 'bg-gray-200 text-gray-700';

                                if (score > 88) {
                                    level = 'High';
                                    description = def.high;
                                    colorClass = 'bg-blue-100 text-blue-800';
                                } else if (score < 56) {
                                    level = 'Low';
                                    description = def.low;
                                    colorClass = 'bg-yellow-100 text-yellow-800';
                                }

                                return (
                                    <div key={key} className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-lg font-bold text-gray-800">{def.title}</h4>
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${colorClass}`}>
                                                {level} ({score.toFixed(0)})
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 italic flex-grow">{def.description}</p>
                                        <div className="text-sm text-gray-800 pt-3 border-t border-gray-100 bg-white/50 -mx-1 px-2 rounded">
                                            <span className="font-semibold text-indigo-600 block mb-1">Interpretation:</span>
                                            {description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* MBTI Results */}
            {(results.results['mbti'] || results.results['mbti_derived']) && (() => {
                const mbti = results.results['mbti'] || results.results['mbti_derived'];
                return (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">MBTI Type ({mbti.type})</h3>
                        <div className="text-center mb-6">
                            <span className="text-5xl font-bold text-blue-600 tracking-widest">
                                {mbti.type}
                            </span>
                            <p className="text-sm text-gray-500 mt-2">Jungian Type Estimate</p>
                        </div>

                        <div className="space-y-4">
                            {Object.entries(mbti.psi || {}).length > 0 ? (
                                Object.entries(mbti.psi || {}).map(([dim, psi]) => {
                                    const score = psi as number;
                                    const left = dim[0];
                                    const right = dim[1];
                                    const leftScore = mbti.traitScores[left];
                                    const rightScore = mbti.traitScores[right];
                                    const total = leftScore + rightScore;
                                    const leftPercent = total ? (leftScore / total) * 100 : 50;

                                    return (
                                        <div key={dim} className="space-y-1">
                                            <div className="flex justify-between text-base font-medium text-gray-700">
                                                <span>{left} ({leftScore?.toFixed(1)})</span>
                                                <span className="text-gray-400 text-xs">PSI: {score.toFixed(2)}</span>
                                                <span>{right} ({rightScore?.toFixed(1)})</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${leftPercent}%` }}
                                                />
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${100 - leftPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Fallback for aggregated views if PSI object isn't pre-calculated
                                [['I', 'E'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([left, right]) => {
                                    const leftScore = mbti.traitScores?.[left] || 0;
                                    const rightScore = mbti.traitScores?.[right] || 0;
                                    const total = leftScore + rightScore;
                                    const ratio = total > 0 ? leftScore / total : 0.5;
                                    const psiVal = Math.abs(ratio - 0.5) * 2;
                                    const leftPercent = ratio * 100;

                                    return (
                                        <div key={`${left}${right}`} className="space-y-1">
                                            <div className="flex justify-between text-base font-medium text-gray-700">
                                                <span>{left} ({leftScore.toFixed(1)})</span>
                                                <span className="text-gray-400 text-xs">PSI: {psiVal.toFixed(2)}</span>
                                                <span>{right} ({rightScore.toFixed(1)})</span>
                                            </div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${leftPercent}%` }}
                                                />
                                                <div
                                                    className="h-full bg-green-500"
                                                    style={{ width: `${100 - leftPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* DISC Results */}
            {results.results['disc'] && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6 border-l-4 border-l-red-500">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">DISC Assessment</h3>
                    <div className="grid grid-cols-4 gap-4 text-center mb-6">
                        {['D', 'I', 'S', 'C'].map(dim => (
                            <div key={dim} className="flex flex-col items-center">
                                <span className={`text-2xl font-bold ${dim === 'D' ? 'text-red-600' :
                                    dim === 'I' ? 'text-yellow-600' :
                                        dim === 'S' ? 'text-green-600' :
                                            'text-blue-600'
                                    }`}>
                                    {dim}
                                </span>
                                <span className="text-3xl font-bold text-gray-800">
                                    {Number(results.results['disc'].traitScores[dim]).toFixed(0)}
                                </span>
                                <div className="w-full h-24 bg-gray-100 rounded-b-lg relative mt-2 w-8">
                                    <div
                                        className={`absolute bottom-0 w-full rounded-b-lg ${dim === 'D' ? 'bg-red-500' :
                                            dim === 'I' ? 'bg-yellow-500' :
                                                dim === 'S' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                            }`}
                                        style={{ height: `${Math.min((results.results['disc'].traitScores[dim] / 28) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-sm text-gray-500">
                        <p><strong>D</strong> = Dominance (Assertive, Direct)</p>
                        <p><strong>I</strong> = Influence (Social, Enthusiastic)</p>
                        <p><strong>S</strong> = Steadiness (Patient, Reliable)</p>
                        <p><strong>C</strong> = Compliance (Analytical, Precise)</p>
                    </div>
                </div>
            )}
            {/* DARK TRIAD Results */}
            {results.results['darktriad'] && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6 border-l-4 border-l-gray-800">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Dark Triad Assessment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {['Machiavellianism', 'Narcissism', 'Psychopathy'].map(trait => {
                            const score = results.results['darktriad'].traitScores[trait] || 0;
                            let color = 'bg-gray-500';
                            if (trait === 'Narcissism') color = 'bg-purple-500';
                            if (trait === 'Psychopathy') color = 'bg-red-600';
                            if (trait === 'Machiavellianism') color = 'bg-blue-800';

                            return (
                                <div key={trait} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <h4 className="font-bold text-gray-700 mb-2">{trait}</h4>
                                    <span className="text-3xl font-bold text-gray-900 mb-4">{score.toFixed(0)}</span>

                                    {/* Vertical Bar */}
                                    <div className="h-32 w-8 bg-gray-200 rounded-full relative overflow-hidden ring-1 ring-gray-300">
                                        <div
                                            className={`absolute bottom-0 w-full rounded-b-full transition-all duration-1000 ${color}`}
                                            style={{ height: `${score}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-2 font-mono">0-100</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="mb-2"><strong>Machiavellianism:</strong> Strategic manipulation and cynicism.</p>
                        <p className="mb-2"><strong>Narcissism:</strong> Grandiosity, entitlement, and lack of empathy.</p>
                        <p><strong>Psychopathy:</strong> Impulsivity and callousness.</p>
                    </div>
                </div>
            )}

            {/* Visual Summary Generation */}
            <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Visual Summary</h3>

                <div className="flex flex-col gap-4">
                    <p className="text-gray-600">
                        Download a high-quality, data-accurate infographic summary of this profile{readOnly ? '' : ', or save it to the public leaderboard'}.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {/* Download Button */}
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGenerating}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all shadow-md ${isGenerating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gray-700 hover:bg-gray-800 hover:shadow-lg'
                                }`}
                        >
                            {isGenerating ? <span className="animate-spin">⏳</span> : <Download className="w-5 h-5" />}
                            Download Image
                        </button>

                        {/* Share Button - Opens Modal */}
                        <button
                            onClick={handleShareClick}
                            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all shadow-md bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 hover:shadow-lg"
                        >
                            <Share2 className="w-5 h-5" />
                            Share Fingerprint
                        </button>

                        {/* ... Save/Upload Button ... */}
                        {!readOnly && (
                            <button
                                onClick={handleSaveRun}
                                disabled={isSaving || saveStatus === 'success'}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-bold transition-all shadow-md ${saveStatus === 'success'
                                    ? 'bg-green-600 cursor-default'
                                    : isSaving
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg'
                                    }`}
                            >
                                {isSaving ? (
                                    <>
                                        <span className="animate-spin">⏳</span> Saving...
                                    </>
                                ) : saveStatus === 'success' ? (
                                    <>
                                        <span>✅</span> Saved!
                                    </>
                                ) : (
                                    <>
                                        <span>☁️</span> Upload to Leaderboard
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {!readOnly && saveStatus === 'error' && <p className="text-red-500 text-sm">Failed to save run. API may be down.</p>}
                </div>


                {/* Audit Logs Section */}



                {/* Share Modal Overlay */}
                {
                    showShareModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
                            <div
                                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-900">Share Results</h3>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => copyToClipboard(clipboardText)}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-black hover:text-white transition-all group border border-gray-100 cursor-pointer"
                                        >
                                            {/* X Logo */}
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-8 h-8 mb-2 text-black group-hover:text-white fill-current">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                                            </svg>
                                            <span className="font-medium">X</span>
                                        </a>

                                        <a
                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => copyToClipboard(clipboardText)}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-[#0077b5] hover:text-white transition-all group border border-gray-100 cursor-pointer"
                                        >
                                            <Linkedin className="w-8 h-8 mb-2 text-[#0077b5] group-hover:text-white" />
                                            <span className="font-medium">LinkedIn</span>
                                        </a>

                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => copyToClipboard(clipboardText)}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-[#1877f2] hover:text-white transition-all group border border-gray-100 cursor-pointer"
                                        >
                                            <Facebook className="w-8 h-8 mb-2 text-[#1877f2] group-hover:text-white" />
                                            <span className="font-medium">Facebook</span>
                                        </a>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(clipboardText);
                                                alert("Link and details copied! You can now paste it on Instagram.");
                                            }}
                                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-50 hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-500 hover:text-white transition-all group border border-gray-100 cursor-pointer"
                                        >
                                            <Instagram className="w-8 h-8 mb-2 text-pink-600 group-hover:text-white" />
                                            <span className="font-medium">Instagram</span>
                                        </button>


                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                                        <p className="font-semibold mb-1">PRO TIP:</p>
                                        <p>Don't forget to <button onClick={handleDownloadImage} className="underline font-bold hover:text-blue-600">Download the Image</button> first to attach it to your post!</p>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-500 font-mono break-all">
                                        <LinkIcon className="w-4 h-4 flex-shrink-0" />
                                        {shareUrl}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }


                {/* Hidden Summary Card for Capture */}
                <div className="overflow-hidden h-0 w-0">
                    <div className="fixed top-0 left-[-9999px]">
                        <SummaryCard ref={summaryRef} profile={results} sourceLabel={sourceLabel} />
                    </div>
                </div>

                {/* Optional: Visible Preview (Scaled Down) */}
                <div className="mt-8">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Image Preview</h4>
                    <div className="overflow-hidden border border-gray-300 rounded-lg bg-gray-100 p-4 flex justify-center items-start transition-all duration-300">
                        {/* Width/Height Wrapper matching the SCALED dimensions */}
                        <div className="relative shrink-0
                        w-[300px] h-[200px]
                        sm:w-[420px] sm:h-[280px]
                        md:w-[600px] md:h-[400px]
                        transition-all duration-300">

                            {/* Scaled Content - Fixed at original 1200x800 */}
                            <div className="absolute top-0 left-0 origin-top-left
                            w-[1200px] h-[800px]
                            scale-[0.25]
                            sm:scale-[0.35]
                            md:scale-[0.5]
                            transition-transform duration-300">
                                <SummaryCard profile={results} sourceLabel={sourceLabel} />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Audit Logs Section - Moved to bottom */}
                {
                    results.logs && results.logs.length > 0 && (
                        <div className="mt-8 border-t pt-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <span>🛡️</span> Verification Logs
                            </h3>
                            <details className="group bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                                <summary className="cursor-pointer p-4 font-mono text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex justify-between items-center select-none">
                                    <span>View Raw Execution Logs ({results.logs.length} entries)</span>
                                    <span className="text-xs text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                {/* Removed max-h-96 to show full logs when expanded */}
                                <div className="p-4 font-mono text-xs text-green-400 bg-black space-y-1 overflow-x-auto">
                                    {results.logs.map((log, i) => (
                                        <div key={i} className={`flex gap-3 border-b border-gray-800 pb-1 mb-1 last:border-0 ${log.type === 'error' ? 'text-red-400' :
                                            log.type === 'success' ? 'text-emerald-400' :
                                                'text-gray-400'
                                            }`}>
                                            <span className="text-gray-600 shrink-0 select-none">[{log.timestamp}]</span>
                                            <span className="break-all whitespace-pre-wrap">{log.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                            <p className="text-xs text-gray-500 mt-2">
                                These logs prove the authenticity of the test results by showing the raw model responses for every question.
                            </p>
                        </div>
                    )
                }
            </div>
        </div >
    );
}
