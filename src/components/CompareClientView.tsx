'use client';

import React, { useState } from 'react';
import { ComparisonChart } from '@/components/ComparisonChart';
import { MbtiCell } from '@/components/MbtiCell';
import { TraitCell } from '@/components/TraitCell';
import { MetricBarChart } from '@/components/MetricBarChart';
import { BIG_FIVE_DEFINITIONS, DISC_DEFINITIONS, DARK_TRIAD_DEFINITIONS } from '@/lib/psychometrics/definitions';
import { ArrowLeft, BarChart3, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';

interface CompareClientViewProps {
    comparisonModels: Array<{
        id: string;
        name: string;
        persona: string;
        scores: Record<string, number>;
        disc: Record<string, number>;
        darkTriad: Record<string, number>;
        mbti: string;
        count: number;
    }>;
}

type BigFiveKey = 'O' | 'C' | 'E' | 'A' | 'N';
type DiscKey = 'D' | 'I' | 'S' | 'C';
type DarkTriadKey = 'Machiavellianism' | 'Narcissism' | 'Psychopathy';
type MetricKey = BigFiveKey | DiscKey | DarkTriadKey;

const BIG_FIVE_KEYS: BigFiveKey[] = ['O', 'C', 'E', 'A', 'N'];
const DISC_KEYS: DiscKey[] = ['D', 'I', 'S', 'C'];
const DARK_TRIAD_KEYS: DarkTriadKey[] = ['Machiavellianism', 'Narcissism', 'Psychopathy'];

const CHART_COLORS = [
    'rgba(255, 99, 132, 0.5)',
    'rgba(54, 162, 235, 0.5)',
    'rgba(255, 206, 86, 0.5)',
    'rgba(75, 192, 192, 0.5)',
    'rgba(153, 102, 255, 0.5)',
    'rgba(255, 159, 64, 0.5)',
];

const metricSections: Array<{ title: string; keys: MetricKey[] }> = [
    { title: 'Big Five (0-120)', keys: BIG_FIVE_KEYS },
    { title: 'DISC Assessment', keys: DISC_KEYS },
    { title: 'Dark Triad (0-100)', keys: DARK_TRIAD_KEYS },
];

export function CompareClientView({ comparisonModels }: CompareClientViewProps) {
    const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([]);
    const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

    const toggleMetric = (metricKey: MetricKey) => {
        setSelectedMetrics((prev) => {
            const next = prev.includes(metricKey)
                ? prev.filter((k) => k !== metricKey)
                : [...prev, metricKey];
            if (next.length === 0) {
                setIsMobileSheetOpen(false);
            }
            return next;
        });
    };

    const getMetricData = (key: MetricKey) => {
        if (BIG_FIVE_KEYS.includes(key as BigFiveKey)) {
            const typedKey = key as BigFiveKey;
            return {
                name: BIG_FIVE_DEFINITIONS[typedKey].title,
                maxValue: 120,
                models: comparisonModels.map((m, i) => ({
                    id: m.id,
                    name: m.name,
                    persona: m.persona,
                    value: m.scores[typedKey] || 0,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                })),
            };
        }

        if (DISC_KEYS.includes(key as DiscKey)) {
            const typedKey = key as DiscKey;
            return {
                name: `DISC - ${DISC_DEFINITIONS[typedKey].title}`,
                maxValue: 100,
                models: comparisonModels.map((m, i) => ({
                    id: m.id,
                    name: m.name,
                    persona: m.persona,
                    value: m.disc[typedKey] || 0,
                    color: CHART_COLORS[i % CHART_COLORS.length],
                })),
            };
        }

        const typedKey = key as DarkTriadKey;
        return {
            name: DARK_TRIAD_DEFINITIONS[typedKey].title,
            maxValue: 100,
            models: comparisonModels.map((m, i) => ({
                id: m.id,
                name: m.name,
                persona: m.persona,
                value: m.darkTriad[typedKey] || 0,
                color: CHART_COLORS[i % CHART_COLORS.length],
            })),
        };
    };

    const getMetricLabel = (key: MetricKey) => {
        if (BIG_FIVE_KEYS.includes(key as BigFiveKey)) {
            return BIG_FIVE_DEFINITIONS[key as BigFiveKey].title;
        }
        if (DISC_KEYS.includes(key as DiscKey)) {
            return `DISC - ${DISC_DEFINITIONS[key as DiscKey].title}`;
        }
        return DARK_TRIAD_DEFINITIONS[key as DarkTriadKey].title;
    };

    const getMetricValue = (model: CompareClientViewProps['comparisonModels'][number], key: MetricKey) => {
        if (BIG_FIVE_KEYS.includes(key as BigFiveKey)) {
            return model.scores[key as BigFiveKey] || 0;
        }
        if (DISC_KEYS.includes(key as DiscKey)) {
            return model.disc[key as DiscKey] || 0;
        }
        return model.darkTriad[key as DarkTriadKey] || 0;
    };

    const getMetricPrecision = (key: MetricKey) => (DISC_KEYS.includes(key as DiscKey) ? 1 : 0);

    return (
        <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${selectedMetrics.length > 0 ? 'pb-28 md:pb-[450px]' : 'pb-24'}`}>
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[95%] mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <Link href="/explorer" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Psychometric Comparison</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Comparing {comparisonModels.length} profiles</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[95%] mx-auto px-4 mt-6 sm:mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
                    <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="flex-grow min-h-[300px] sm:min-h-[380px]">
                            <ComparisonChart models={comparisonModels} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Overview</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[620px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 px-4 font-medium text-gray-500 w-1/4">Model / Persona</th>
                                        <th className="py-3 px-4 font-medium text-gray-500">MBTI</th>
                                        <th className="py-3 px-4 font-medium text-gray-500">Samples</th>
                                        <th className="py-3 px-4 font-medium text-gray-500">Primary Trait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonModels.map((m, i) => {
                                        const entries = Object.entries(m.scores);
                                        const maxTrait = entries.length > 0
                                            ? entries.reduce((a, b) => (a[1] > b[1] ? a : b))
                                            : ['N/A', 0] as [string, number];
                                        const traitName = BIG_FIVE_DEFINITIONS[maxTrait[0] as BigFiveKey]?.title || maxTrait[0];
                                        const color = CHART_COLORS[i % CHART_COLORS.length].replace('0.5', '1');

                                        return (
                                            <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-gray-900 break-words">{m.name}</div>
                                                            <div className="text-xs text-indigo-600 bg-indigo-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                                                                {m.persona}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <MbtiCell mbti={m.mbti} />
                                                </td>
                                                <td className="py-3 px-4 text-gray-500">{m.count}</td>
                                                <td className="py-3 px-4 text-gray-700">
                                                    High {traitName} <span className="text-gray-400">({maxTrait[1].toFixed(0)})</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 hidden md:block">
                    <div className="p-6 border-b border-gray-100 bg-indigo-50/30 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Detailed Metric Comparison</h3>
                            <p className="text-sm text-gray-500 mt-1">Click on any metric row to pin a comparison chart below.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="py-4 px-6 text-left font-bold text-gray-500 uppercase tracking-wider text-xs w-64 sticky left-0 bg-gray-50 z-20">
                                        Metric
                                    </th>
                                    {comparisonModels.map((m, i) => (
                                        <th key={m.id} className={`py-4 px-6 font-bold text-gray-900 min-w-[150px] ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                                            <div className="flex flex-col items-center">
                                                <span className="text-sm">{m.name}</span>
                                                {m.persona !== 'Base Model' && <span className="text-[10px] text-gray-500 font-normal">{m.persona}</span>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Big Five (0-120)</td></tr>
                                {BIG_FIVE_KEYS.map((t) => {
                                    const isSelected = selectedMetrics.includes(t);
                                    return (
                                        <tr
                                            key={t}
                                            onClick={() => toggleMetric(t)}
                                            className={`transition cursor-pointer group ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className={`py-3 px-6 text-left font-medium sticky left-0 overflow-visible z-10 transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-900' : 'bg-white text-gray-700 group-hover:bg-gray-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <TraitCell title={BIG_FIVE_DEFINITIONS[t].title} def={BIG_FIVE_DEFINITIONS[t]} range="0-120" />
                                                    {isSelected && <BarChart3 className="w-4 h-4 text-indigo-500 animate-in fade-in" />}
                                                </div>
                                            </td>
                                            {comparisonModels.map((m, i) => (
                                                <td key={m.id} className={`py-3 px-6 ${i > 0 ? 'border-l border-gray-100 group-hover:border-gray-200' : ''}`}>
                                                    <span className="font-mono font-bold text-gray-800">{m.scores[t]?.toFixed(0)}</span>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}

                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">DISC Assessment</td></tr>
                                {DISC_KEYS.map((t) => {
                                    const isSelected = selectedMetrics.includes(t);
                                    return (
                                        <tr
                                            key={`disc-${t}`}
                                            onClick={() => toggleMetric(t)}
                                            className={`transition cursor-pointer group ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className={`py-3 px-6 text-left font-medium sticky left-0 overflow-visible z-10 transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-900' : 'bg-white text-gray-700 group-hover:bg-gray-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <TraitCell title={`DISC - ${t}`} def={DISC_DEFINITIONS[t]} range="0-100 (Est)" />
                                                    {isSelected && <BarChart3 className="w-4 h-4 text-indigo-500 animate-in fade-in" />}
                                                </div>
                                            </td>
                                            {comparisonModels.map((m, i) => (
                                                <td key={m.id} className={`py-3 px-6 ${i > 0 ? 'border-l border-gray-100 group-hover:border-gray-200' : ''}`}>
                                                    <span className="font-mono text-gray-600">{m.disc[t]?.toFixed(1)}</span>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}

                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Dark Triad (0-100)</td></tr>
                                {DARK_TRIAD_KEYS.map((t) => {
                                    const isSelected = selectedMetrics.includes(t);
                                    return (
                                        <tr
                                            key={t}
                                            onClick={() => toggleMetric(t)}
                                            className={`transition cursor-pointer group ${isSelected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className={`py-3 px-6 text-left font-medium sticky left-0 overflow-visible z-10 transition-colors ${isSelected ? 'bg-indigo-50 text-indigo-900' : 'bg-white text-gray-700 group-hover:bg-gray-50'}`}>
                                                <div className="flex items-center justify-between">
                                                    <TraitCell title={t} def={DARK_TRIAD_DEFINITIONS[t]} range="0-100" />
                                                    {isSelected && <BarChart3 className="w-4 h-4 text-indigo-500 animate-in fade-in" />}
                                                </div>
                                            </td>
                                            {comparisonModels.map((m, i) => {
                                                const score = m.darkTriad[t] || 0;
                                                const color = score > 66 ? 'text-red-600 font-bold' : 'text-gray-800';
                                                return (
                                                    <td key={m.id} className={`py-3 px-6 ${i > 0 ? 'border-l border-gray-100 group-hover:border-gray-200' : ''}`}>
                                                        <span className={`font-mono ${color}`}>{score.toFixed(0)}</span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:hidden space-y-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-base font-bold text-gray-800">Detailed Metric Comparison</h3>
                        <p className="text-xs text-gray-500 mt-1">Tap any metric to pin a chart in the compare panel.</p>
                    </div>
                    {metricSections.map((section, idx) => (
                        <details key={section.title} className="bg-white border border-gray-200 rounded-xl overflow-hidden" open={idx === 0}>
                            <summary className="px-4 py-3 text-sm font-semibold text-gray-800 bg-gray-50 cursor-pointer">
                                {section.title}
                            </summary>
                            <div className="p-3 space-y-3">
                                {section.keys.map((metricKey) => {
                                    const isSelected = selectedMetrics.includes(metricKey);
                                    return (
                                        <div key={metricKey} className={`rounded-lg border ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                                            <button
                                                type="button"
                                                onClick={() => toggleMetric(metricKey)}
                                                className="w-full min-h-[44px] px-3 py-2 flex items-center justify-between text-left"
                                            >
                                                <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                                                    {getMetricLabel(metricKey)}
                                                </span>
                                                {isSelected ? <BarChart3 className="w-4 h-4 text-indigo-600" /> : <span className="text-xs text-gray-400">Tap to compare</span>}
                                            </button>
                                            <div className="px-3 pb-3 space-y-2">
                                                {comparisonModels.map((model) => (
                                                    <div key={`mobile-metric-${metricKey}-${model.id}`} className="flex items-center justify-between text-xs border border-gray-100 rounded p-2 bg-gray-50">
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-gray-900 truncate">{model.name}</div>
                                                            {model.persona !== 'Base Model' && <div className="text-[10px] text-gray-500 truncate">{model.persona}</div>}
                                                        </div>
                                                        <div className="font-mono font-semibold text-gray-800 ml-3">
                                                            {getMetricValue(model, metricKey).toFixed(getMetricPrecision(metricKey))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    ))}
                </div>
            </div>

            {selectedMetrics.length > 0 && (
                <>
                    {isMobileSheetOpen && (
                        <button
                            type="button"
                            className="fixed inset-0 bg-black/25 z-30 md:hidden"
                            onClick={() => setIsMobileSheetOpen(false)}
                            aria-label="Close comparison charts"
                        />
                    )}

                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
                        <div className="bg-white border-t border-gray-200 shadow-[0_-6px_22px_rgba(0,0,0,0.15)] rounded-t-2xl">
                            <div className="px-4 py-3 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => setIsMobileSheetOpen((prev) => !prev)}
                                    className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-gray-900"
                                >
                                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                                    {selectedMetrics.length} pinned metric{selectedMetrics.length === 1 ? '' : 's'}
                                    {isMobileSheetOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronUp className="w-4 h-4 text-gray-500" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMetrics([]);
                                        setIsMobileSheetOpen(false);
                                    }}
                                    className="min-h-[44px] px-3 text-xs font-semibold text-gray-500"
                                >
                                    Clear all
                                </button>
                            </div>
                            {isMobileSheetOpen && (
                                <div className="h-[62vh] border-t border-gray-100 p-4 overflow-y-auto">
                                    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
                                        {selectedMetrics.map((metricKey) => {
                                            const data = getMetricData(metricKey);
                                            return (
                                                <div key={`mobile-chart-${metricKey}`} className="w-[280px] h-[300px] flex-shrink-0 snap-start rounded-xl border border-gray-200 bg-gray-50 p-2">
                                                    <MetricBarChart
                                                        metricName={data.name}
                                                        models={data.models}
                                                        maxValue={data.maxValue}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="max-w-[95%] mx-auto px-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-gray-900">Custom Comparison ({selectedMetrics.length})</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedMetrics([]);
                                        setIsMobileSheetOpen(false);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="py-6 overflow-x-auto">
                                <div className="flex gap-6 pb-2 min-w-min">
                                    {selectedMetrics.map((metricKey) => {
                                        const data = getMetricData(metricKey);
                                        return (
                                            <div key={metricKey} className="w-[350px] flex-shrink-0 h-[300px]">
                                                <MetricBarChart
                                                    metricName={data.name}
                                                    models={data.models}
                                                    maxValue={data.maxValue}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
