'use client';

import React, { useState } from 'react';
import { ComparisonChart } from './ComparisonChart';
import Link from 'next/link';
import { Search, ArrowUpDown, Info, BarChart2, X } from 'lucide-react';
import { BIG_FIVE_DEFINITIONS, DISC_DEFINITIONS, MBTI_DEFINITIONS, DARK_TRIAD_DEFINITIONS } from '../lib/psychometrics/definitions';

// ... (rest of imports)

const getTraitTooltip = (key: string) => {
    let def: any = null;
    let rangeText = "";

    if (key.startsWith('disc-')) {
        const discKey = key.split('-')[1];
        def = DISC_DEFINITIONS[discKey];
        rangeText = "Range: 0-100 (Est)";
    } else if (key.startsWith('dt-')) {
        const dtKey = key.split('-')[1];
        def = DARK_TRIAD_DEFINITIONS[dtKey];
        rangeText = "Range: 0-100";
    } else {
        def = BIG_FIVE_DEFINITIONS[key];
        rangeText = "Range: 0-120";
    }

    if (!def) return null;

    return (
        <div className="absolute z-50 hidden group-hover:block w-72 p-4 bg-gray-900 text-white text-xs rounded shadow-2xl -translate-x-1/2 left-1/2 mt-2 pointer-events-none text-left font-normal whitespace-normal border border-gray-700">
            <div className="flex justify-between items-baseline mb-1">
                <div className="font-bold text-sm text-white">{def.title}</div>
                <div className="text-[10px] text-gray-400 font-mono">{rangeText}</div>
            </div>
            <div className="mb-3 text-gray-300 leading-relaxed border-b border-gray-700 pb-2">{def.description}</div>

            <div className="grid grid-cols-[35px_1fr] gap-x-3 gap-y-2">
                <span className="text-green-400 font-bold text-right">High:</span> <span className="text-gray-200">{def.high}</span>
                {def.medium && <><span className="text-yellow-400 font-bold text-right">Med:</span> <span className="text-gray-200">{def.medium}</span></>}
                <span className="text-red-400 font-bold text-right">Low:</span> <span className="text-gray-200">{def.low}</span>
            </div>
        </div>
    );
};

interface LeaderboardEntry {
    id: string; // Unique ID (Name + Persona)
    name: string;
    persona: string;
    count: number;
    scores: Record<string, number>;
    disc: Record<string, number>;
    darkTriad?: Record<string, number>;
    mbti: string;
}

interface LeaderboardTableProps {
    data: LeaderboardEntry[];
}

type SortField = 'name' | 'count' | 'mbti' | 'O' | 'C' | 'E' | 'A' | 'N' | 'disc-D' | 'disc-I' | 'disc-S' | 'disc-C' | 'dt-Machiavellianism' | 'dt-Narcissism' | 'dt-Psychopathy';

const getScoreColor = (score: number, type: 'bigfive' | 'disc') => {
    if (type === 'bigfive') {
        if (score >= 80) return 'text-green-600 font-bold';
        if (score >= 40) return 'text-yellow-600 font-medium';
        return 'text-red-500';
    } else {
        if (score >= 66) return 'text-green-600 font-bold';
        if (score >= 33) return 'text-yellow-600 font-medium';
        return 'text-red-500';
    }
};

export function LeaderboardTable({ data }: LeaderboardTableProps) {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('count');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [selectedModels, setSelectedModels] = useState<string[]>([]); // Store IDs
    const [isComparing, setIsComparing] = useState(false);
    const [personaFilter, setPersonaFilter] = useState('Base Models Only');

    // Get unique personas for dropdown and sort them
    const availablePersonas = Array.from(new Set(data.map(d => d.persona)))
        .filter(p => p !== 'Base Model')
        .sort((a, b) => a.localeCompare(b));

    // Filter
    const filteredData = data.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(search.toLowerCase()) ||
            model.mbti.toLowerCase().includes(search.toLowerCase()) ||
            model.persona.toLowerCase().includes(search.toLowerCase());

        // Persona Filter Logic
        if (personaFilter === 'Base Models Only') {
            return matchesSearch && (model.persona === 'Base Model');
        }
        if (personaFilter === 'All Personas') {
            return matchesSearch;
        }
        return matchesSearch && model.persona === personaFilter;
    });

    // Sort
    const sortedData = [...filteredData].sort((a, b) => {
        let valA: any = a[sortField as keyof LeaderboardEntry];
        let valB: any = b[sortField as keyof LeaderboardEntry];

        // Handle nested scores
        if (['O', 'C', 'E', 'A', 'N'].includes(sortField)) {
            valA = a.scores[sortField] || 0;
            valB = b.scores[sortField] || 0;
        } else if (sortField.startsWith('disc-')) {
            const key = sortField.split('-')[1];
            valA = a.disc[key] || 0;
            valB = b.disc[key] || 0;
        } else if (sortField.startsWith('dt-')) {
            const key = sortField.split('-')[1];
            valA = a.darkTriad?.[key] || 0;
            valB = b.darkTriad?.[key] || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedModels(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };



    const getMbtiTooltip = (type: string) => {
        const desc = MBTI_DEFINITIONS[type] || "No description available.";
        return (
            <div className="absolute z-50 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded shadow-xl left-full ml-2 top-0 pointer-events-none text-left font-normal whitespace-normal border border-gray-700">
                <div className="font-bold text-sm text-indigo-400 mb-1">{type}</div>
                <div className="text-gray-300">{desc}</div>
            </div>
        );
    };

    // Header Helper
    const SortableHeader = ({ field, label, color, traitKey }: { field: SortField, label: string, color: string, traitKey?: string }) => (
        <th
            className={`px-2 py-3 text-center uppercase cursor-pointer hover:bg-gray-100 transition group relative ${color}`}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center justify-center gap-1 font-bold w-full">
                <span>{label}</span>
                {sortField === field && (
                    <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                )}
            </div>
            {traitKey && getTraitTooltip(traitKey)}
        </th>
    );

    if (isComparing) {
        // Comparison View using IDs
        const comparisonModels = data.filter(m => selectedModels.includes(m.id));
        return (
            <div className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Model Comparison</h2>
                    <button onClick={() => setIsComparing(false)} className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50">
                        <X className="w-4 h-4" /> Close Comparison
                    </button>
                </div>

                {/* Radar Chart */}
                <div className="mb-8 border-b border-gray-100 pb-8">
                    <ComparisonChart models={comparisonModels} />
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-gray-500">Feature</th>
                                {comparisonModels.map(m => (
                                    <th key={m.id} className="px-4 py-2 text-center font-bold text-indigo-600">
                                        <div className="flex flex-col items-center">
                                            <span>{m.name}</span>
                                            {m.persona !== 'Base Model' && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1 rounded mt-0.5">{m.persona}</span>}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-4 py-3 font-medium text-gray-700">MBTI Type</td>
                                {comparisonModels.map(m => (
                                    <td key={m.id} className="px-4 py-3 text-center">
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm font-bold">{m.mbti}</span>
                                    </td>
                                ))}
                            </tr>
                            {/* Big Five Rows */}
                            {['O', 'C', 'E', 'A', 'N'].map(t => (
                                <tr key={t}>
                                    <td className="px-4 py-3 font-medium text-gray-700">{BIG_FIVE_DEFINITIONS[t].title} ({t})</td>
                                    {comparisonModels.map(m => (
                                        <td key={m.id} className="px-4 py-3 text-center">
                                            <div className="font-bold text-gray-900">{m.scores[t]?.toFixed(1)}</div>
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500"
                                                    style={{ width: `${(m.scores[t] / 120) * 100}%` }}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {/* DISC Rows */}
                            {['D', 'I', 'S', 'C'].map(t => (
                                <tr key={`disc-${t}`}>
                                    <td className="px-4 py-3 font-medium text-gray-700">DISC - {t}</td>
                                    {comparisonModels.map(m => (
                                        <td key={m.id} className="px-4 py-3 text-center text-gray-600">
                                            {m.disc[t]?.toFixed(2)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 relative">
            {/* Search Bar & Actions */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 bg-white md:bg-transparent p-2 md:p-0 rounded border md:border-none border-gray-200" suppressHydrationWarning>
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search models..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-500"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Persona Filter */}
                    <select
                        value={personaFilter}
                        onChange={(e) => setPersonaFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded text-sm bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 flex-1 md:flex-none"
                    >
                        <option>Base Models Only</option>
                        <option>All Personas</option>
                        {availablePersonas.map(p => <option key={p}>{p}</option>)}
                    </select>

                    {selectedModels.length > 0 && (
                        <button
                            onClick={() => setIsComparing(true)}
                            className="auth-button flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow-sm animate-in fade-in slide-in-from-right-4 whitespace-nowrap"
                        >
                            <BarChart2 className="w-4 h-4" />
                            Compare ({selectedModels.length})
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-10 sticky left-0 bg-gray-50 z-30">
                                <span className="sr-only">Select</span>
                            </th>
                            <th
                                className="px-4 py-3 text-left font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 sticky left-10 bg-gray-50 z-30"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Model
                                    {sortField === 'name' && <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />}
                                </div>
                            </th>
                            <SortableHeader field="count" label="Runs" color="text-gray-500" />
                            <SortableHeader field="mbti" label="MBTI" color="text-indigo-600" />

                            <SortableHeader field="O" label="Open" color="text-blue-600" traitKey="O" />
                            <SortableHeader field="C" label="Cons" color="text-green-600" traitKey="C" />
                            <SortableHeader field="E" label="Extr" color="text-yellow-600" traitKey="E" />
                            <SortableHeader field="A" label="Agre" color="text-purple-600" traitKey="A" />
                            <SortableHeader field="N" label="Neur" color="text-red-600" traitKey="N" />

                            <SortableHeader field="disc-D" label="Dom" color="text-red-500 border-l border-gray-200" traitKey="disc-D" />
                            <SortableHeader field="disc-I" label="Inf" color="text-yellow-500" traitKey="disc-I" />
                            <SortableHeader field="disc-S" label="Std" color="text-green-500" traitKey="disc-S" />

                            <SortableHeader field="disc-C" label="Com" color="text-blue-500" traitKey="disc-C" />

                            <SortableHeader field="dt-Machiavellianism" label="M" color="text-blue-900 font-bold border-l border-gray-200" traitKey="dt-Machiavellianism" />
                            <SortableHeader field="dt-Narcissism" label="N" color="text-purple-800 font-bold" traitKey="dt-Narcissism" />
                            <SortableHeader field="dt-Psychopathy" label="P" color="text-red-900 font-bold" traitKey="dt-Psychopathy" />

                            <th className="px-4 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((model) => (
                            <tr key={model.id} className={`hover:bg-gray-50 transition-colors ${selectedModels.includes(model.id) ? 'bg-indigo-50' : ''}`}>
                                <td className="px-4 py-3 w-10 sticky left-0 bg-white z-20">
                                    <input
                                        type="checkbox"
                                        checked={selectedModels.includes(model.id)}
                                        onChange={() => toggleSelection(model.id)}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900 sticky left-10 bg-white z-20">
                                    <Link href={`/explorer/${encodeURIComponent(model.name)}`} className="hover:text-indigo-600 underline decoration-dotted underline-offset-4 block max-w-[120px] sm:max-w-none truncate sm:whitespace-normal">
                                        {model.name}
                                    </Link>
                                    {model.persona !== 'Base Model' && (
                                        <div className="text-xs font-normal text-gray-500 mt-1 inline-block ml-2 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                            {model.persona}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-gray-600">
                                    {model.count}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-bold text-indigo-600 group relative cursor-help">
                                    {model.mbti}
                                    {getMbtiTooltip(model.mbti)}
                                </td>

                                {['O', 'C', 'E', 'A', 'N'].map(trait => (
                                    <td key={trait} className="px-2 py-3 text-center">
                                        <div className={`text-sm ${getScoreColor(model.scores[trait], 'bigfive')}`}>
                                            {model.scores[trait]?.toFixed(0)}
                                        </div>
                                    </td>
                                ))}

                                {['D', 'I', 'S', 'C'].map(trait => (
                                    <td key={`disc-${trait}`} className={`px-2 py-3 text-center ${trait === 'D' ? 'border-l border-gray-200' : ''}`}>
                                        <div className={`text-sm ${getScoreColor(model.disc[trait], 'disc')}`}>
                                            {typeof model.disc[trait] === 'number' ? model.disc[trait].toFixed(2) : '0.00'}
                                        </div>
                                    </td>
                                ))}

                                <td className="px-2 py-3 text-center border-l border-gray-200 font-mono text-sm font-bold text-blue-900">
                                    {model.darkTriad?.['Machiavellianism']?.toFixed(0) || '-'}
                                </td>
                                <td className="px-2 py-3 text-center font-mono text-sm font-bold text-purple-800">
                                    {model.darkTriad?.['Narcissism']?.toFixed(0) || '-'}
                                </td>
                                <td className="px-2 py-3 text-center font-mono text-sm font-bold text-red-900">
                                    {model.darkTriad?.['Psychopathy']?.toFixed(0) || '-'}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap text-center font-medium">
                                    <Link href={`/runs?search=${encodeURIComponent(model.name)}`} className="text-gray-400 hover:text-indigo-600">
                                        <Info className="w-4 h-4 mx-auto" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedData.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                    {data.length === 0 ? "No data available yet." : "No matching models found."}
                </div>
            )}
        </div>
    );
}
