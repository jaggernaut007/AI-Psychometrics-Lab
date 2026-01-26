'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowUpDown, Info, BarChart2 } from 'lucide-react';
import { BIG_FIVE_DEFINITIONS, DISC_DEFINITIONS, MBTI_DEFINITIONS, DARK_TRIAD_DEFINITIONS } from '../lib/psychometrics/definitions';

// ... (rest of imports)



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

    const toggleSelection = (id: string) => {
        setSelectedModels(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length >= 3) {
                alert("You can only compare up to 3 models at a time.");
                return prev;
            }
            return [...prev, id];
        });
    };

    const sortedData = [...filteredData].sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

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
        } else {
            // Top level fields
            valA = a[sortField as keyof LeaderboardEntry] as number | string;
            valB = b[sortField as keyof LeaderboardEntry] as number | string;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getTraitTooltip = (key: string) => {
        interface TraitDef {
            title: string;
            description: string;
            high: string;
            medium?: string;
            low: string;
        }

        let def: TraitDef | null = null;
        let rangeText = "";

        if (key.startsWith('disc-')) {
            const discKey = key.split('-')[1];
            def = DISC_DEFINITIONS[discKey] as unknown as TraitDef;
            rangeText = "Range: 0-100 (Est)";
        } else if (key.startsWith('dt-')) {
            const dtKey = key.split('-')[1];
            def = DARK_TRIAD_DEFINITIONS[dtKey] as unknown as TraitDef;
            rangeText = "Range: 0-100";
        } else {
            def = BIG_FIVE_DEFINITIONS[key] as unknown as TraitDef;
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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
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

                    <div className="flex items-center gap-2">
                        <Link
                            href={selectedModels.length >= 2 ? `/compare?ids=${selectedModels.map(encodeURIComponent).join(',')}` : '#'}
                            aria-disabled={selectedModels.length < 2}
                            onClick={(e) => {
                                if (selectedModels.length < 2) e.preventDefault();
                            }}
                            className={`auth-button flex items-center gap-2 px-4 py-2 rounded-md transition shadow-sm whitespace-nowrap ${selectedModels.length >= 2
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer animate-in fade-in'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                }`}
                            title={selectedModels.length < 2 ? "Select at least 2 models to compare" : "Compare selected models"}
                        >
                            <BarChart2 className={`w-4 h-4 ${selectedModels.length >= 2 ? '' : 'text-gray-400'}`} />
                            Compare ({selectedModels.length}/3)
                        </Link>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto min-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-16 sticky left-0 bg-gray-50 z-30 text-xs font-bold text-gray-400 uppercase tracking-wider text-center border-r border-gray-100">
                                Compare
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
