'use client';

import React, { useState } from 'react';
import { ComparisonChart } from '@/components/ComparisonChart';
import { MbtiCell } from '@/components/MbtiCell';
import { TraitCell } from '@/components/TraitCell';
import { MetricBarChart } from '@/components/MetricBarChart';
import { BIG_FIVE_DEFINITIONS, DISC_DEFINITIONS, DARK_TRIAD_DEFINITIONS } from '@/lib/psychometrics/definitions';
import { ArrowLeft, ChevronDown, ChevronUp, BarChart3, X } from 'lucide-react';
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

const CHART_COLORS = [
    'rgba(255, 99, 132, 0.5)',   // Red
    'rgba(54, 162, 235, 0.5)',   // Blue
    'rgba(255, 206, 86, 0.5)',   // Yellow
    'rgba(75, 192, 192, 0.5)',   // Teal
    'rgba(153, 102, 255, 0.5)',  // Purple
    'rgba(255, 159, 64, 0.5)',   // Orange
];

export function CompareClientView({ comparisonModels }: CompareClientViewProps) {
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

    const toggleMetric = (metricKey: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metricKey)
                ? prev.filter(k => k !== metricKey)
                : [...prev, metricKey]
        );
    };

    // Helper to get data for a specific metric key
    const getMetricData = (key: string) => {
        // Check Big Five
        if (['O', 'C', 'E', 'A', 'N'].includes(key)) {
            return {
                name: BIG_FIVE_DEFINITIONS[key].title,
                maxValue: 120,
                models: comparisonModels.map((m, i) => ({
                    id: m.id,
                    name: m.name,
                    persona: m.persona,
                    value: m.scores[key] || 0,
                    color: CHART_COLORS[i % CHART_COLORS.length]
                }))
            };
        }
        // Check DISC
        if (['D', 'I', 'S', 'C'].includes(key)) {
            return {
                name: `DISC - ${DISC_DEFINITIONS[key].title}`,
                maxValue: 100,
                models: comparisonModels.map((m, i) => ({
                    id: m.id,
                    name: m.name,
                    persona: m.persona,
                    value: m.disc[key] || 0,
                    color: CHART_COLORS[i % CHART_COLORS.length]
                }))
            };
        }
        // Check Dark Triad
        if (['Machiavellianism', 'Narcissism', 'Psychopathy'].includes(key)) {
            return {
                name: DARK_TRIAD_DEFINITIONS[key].title,
                maxValue: 100,
                models: comparisonModels.map((m, i) => ({
                    id: m.id,
                    name: m.name,
                    persona: m.persona,
                    value: m.darkTriad[key] || 0,
                    color: CHART_COLORS[i % CHART_COLORS.length]
                }))
            };
        }
        return null;
    };

    return (
        <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${selectedMetrics.length > 0 ? 'pb-[450px]' : 'pb-24'}`}>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-[95%] mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/explorer" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Psychometric Comparison</h1>
                            <p className="text-sm text-gray-500 hidden sm:block">Comparing {comparisonModels.length} profiles</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[95%] mx-auto px-4 mt-8">
                {/* Visualizations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Radar Chart */}
                    <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="flex-grow min-h-[400px]">
                            <ComparisonChart models={comparisonModels} />
                        </div>
                    </div>

                    {/* Key Stats / Summary */}
                    <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Overview</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
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
                                            ? entries.reduce((a, b) => a[1] > b[1] ? a : b)
                                            : ['N/A', 0] as [string, number];
                                        const traitName = BIG_FIVE_DEFINITIONS[maxTrait[0]]?.title || maxTrait[0];
                                        const color = CHART_COLORS[i % CHART_COLORS.length].replace('0.5', '1');

                                        return (
                                            <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{m.name}</div>
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

                {/* Detailed Comparison Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-12">
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
                                {/* BIG FIVE */}
                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Big Five (0-120)</td></tr>
                                {['O', 'C', 'E', 'A', 'N'].map(t => {
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-mono font-bold text-gray-800">{m.scores[t]?.toFixed(0)}</span>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}

                                {/* DISC */}
                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">DISC Assessment</td></tr>
                                {['D', 'I', 'S', 'C'].map(t => {
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

                                {/* DARK TRIAD */}
                                <tr className="bg-gray-50/50"><td colSpan={comparisonModels.length + 1} className="py-2 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Dark Triad (0-100)</td></tr>
                                {['Machiavellianism', 'Narcissism', 'Psychopathy'].map(t => {
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
                                                let color = 'text-gray-800';
                                                if (score > 66) color = 'text-red-600 font-bold';
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

                {/* Selected Metrics Charts Panel */}
                {selectedMetrics.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 animate-in slide-in-from-bottom-10 duration-300">
                        <div className="max-w-[95%] mx-auto px-4">
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                    <h3 className="font-bold text-gray-900">Custom Comparison ({selectedMetrics.length})</h3>
                                </div>
                                <button
                                    onClick={() => setSelectedMetrics([])}
                                    className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="py-6 overflow-x-auto">
                                <div className="flex gap-6 pb-2 min-w-min">
                                    {selectedMetrics.map(metricKey => {
                                        const data = getMetricData(metricKey);
                                        if (!data) return null;
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
                )}
            </div>
        </div>
    );
}
