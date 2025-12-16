"use client";

import React, { forwardRef } from 'react';
import { ModelProfile } from '@/lib/psychometrics/types';
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

interface SummaryCardProps {
    profile: ModelProfile;
}

export const SummaryCard = forwardRef<HTMLDivElement, SummaryCardProps>(({ profile }, ref) => {
    const { modelName, results } = profile;
    const bigFive = results['bigfive']?.traitScores;
    const mbti = results['mbti'] || results['mbti_derived'];
    const disc = results['disc']?.traitScores;

    // Big Five Radar Data
    const domains = ['Neuroticism', 'Extraversion', 'Openness', 'Agreeableness', 'Conscientiousness'];
    const domainKeys = ['N', 'E', 'O', 'A', 'C'];
    const bigFiveValues = bigFive ? domainKeys.map(key => bigFive[key] || 0) : [];

    // Explicit Hex colors for Chart.js to avoid any inheritance issues
    const bigFiveData = {
        labels: domains,
        datasets: [
            {
                label: modelName,
                data: bigFiveValues,
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // #3b82f6 with opacity
                borderColor: '#3b82f6', // Hex Blue-500
                borderWidth: 2,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
            },
        ],
    };

    const bigFiveOptions = {
        scales: {
            r: {
                min: 0,
                max: 120,
                ticks: { stepSize: 20, display: false },
                pointLabels: {
                    font: { size: 11, family: 'Inter, sans-serif' },
                    color: '#e5e7eb' // Hex Gray-200
                },
                grid: {
                    color: '#374151' // Hex Gray-700
                },
                angleLines: {
                    color: '#374151' // Hex Gray-700
                }
            },
        },
        layout: {
            padding: 10
        },
        plugins: { legend: { display: false } },
        maintainAspectRatio: false,
    };

    // Helper for rendering Center-Out MBTI bars with explicit hex styles
    const renderMbtiRow = (left: string, right: string, lScore: number, rScore: number, psiVal?: number) => {
        const total = lScore + rScore;
        const ratio = total > 0 ? lScore / total : 0.5;
        const calculatedPsi = Math.abs(ratio - 0.5) * 2;
        const displayPsi = psiVal !== undefined ? psiVal : calculatedPsi;
        const percentWidth = displayPsi * 50;
        const isLeftDominant = ratio >= 0.5;

        // Colors: Blue (#3b82f6), Green (#22c55e), Gray Text (#9ca3af), Gray Bar (#1f2937)
        return (
            <div key={`${left}-${right}`} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#9ca3af] mb-1 px-1">
                    <span style={{ color: isLeftDominant ? '#60a5fa' : '#4b5563' }}>{left}</span>
                    <span className="text-[#9ca3af] font-mono">PSI: {displayPsi.toFixed(2)}</span>
                    <span style={{ color: !isLeftDominant ? '#4ade80' : '#4b5563' }}>{right}</span>
                </div>

                <div className="h-3 rounded-full bg-[#1f2937] relative w-full">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#4b5563] z-10 -ml-px"></div>
                    <div
                        className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
                        style={{
                            width: `${percentWidth}%`,
                            backgroundColor: isLeftDominant ? '#3b82f6' : '#22c55e',
                            [isLeftDominant ? 'right' : 'left']: '50%',
                            borderTopRightRadius: isLeftDominant ? 0 : 9999,
                            borderBottomRightRadius: isLeftDominant ? 0 : 9999,
                            borderTopLeftRadius: !isLeftDominant ? 0 : 9999,
                            borderBottomLeftRadius: !isLeftDominant ? 0 : 9999,
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className="p-8 w-[1200px] h-[800px] flex flex-col font-sans relative"
            style={{
                fontFamily: 'Inter, sans-serif',
                backgroundColor: '#050B14', // Hex Very Dark Blue
                color: '#f3f4f6' // Hex Gray-100
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b pb-4" style={{ borderColor: '#1F2937' }}>
                <h1 className="text-5xl font-black tracking-tighter" style={{ color: '#ffffff' }}>
                    {modelName} {profile.persona && <span className="opacity-50 text-4xl font-bold ml-2">({profile.persona})</span>}
                </h1>
                <div className="text-sm font-medium opacity-60">Psychometric Fingerprint</div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-6 flex-1 h-full">

                {/* Column 1: Big Five (Radar) */}
                <div className="flex flex-col p-6 rounded-2xl border relative overflow-hidden"
                    style={{ backgroundColor: '#0B1221', borderColor: '#1F2937' }}>
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#2563eb' }}></div> {/* Blue-600 */}
                    <h2 className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: '#60a5fa' }}>
                        Big Five Profile
                    </h2>

                    <div className="flex-1 relative mb-4 flex items-center justify-center">
                        <div className="w-[300px] h-[300px]">
                            {bigFive && <Radar data={bigFiveData} options={bigFiveOptions} />}
                        </div>
                    </div>
                    {/* Big Five Scores List - Bottom Aligned */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mt-auto pb-2">
                        <div className="space-y-1">
                            {['N', 'O', 'C'].map(key => {
                                const index = domainKeys.indexOf(key);
                                return (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="font-medium text-[#9ca3af]">{domains[index]}</span>
                                        <span className="font-bold text-[#60a5fa]">{Math.round(bigFive?.[key] || 0)}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="space-y-1">
                            {['E', 'A'].map(key => {
                                const index = domainKeys.indexOf(key);
                                return (
                                    <div key={key} className="flex justify-between items-center">
                                        <span className="font-medium text-[#9ca3af]">{domains[index]}</span>
                                        <span className="font-bold text-[#60a5fa]">{Math.round(bigFive?.[key] || 0)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Column 2: MBTI (Type + Center-Out PSI Bars) */}
                <div className="flex flex-col p-6 rounded-2xl border relative overflow-hidden"
                    style={{ backgroundColor: '#0B1221', borderColor: '#1F2937' }}>
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#2563eb' }}></div>
                    <h2 className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: '#60a5fa' }}>
                        Jungian Type
                    </h2>

                    {mbti && (
                        <div className="flex flex-col h-full">
                            <div className="text-center mb-16 mt-12">
                                <span className="text-[7rem] font-black tracking-tighter block" style={{ color: '#3b82f6', lineHeight: 0.8 }}>
                                    {mbti.type}
                                </span>
                                <span className="text-xs font-bold tracking-[0.3em] text-gray-500 uppercase block mt-4">
                                    Estimated Type
                                </span>
                            </div>

                            <div className="space-y-6 mt-12">
                                {Object.entries(mbti.psi || {}).length > 0 ? (
                                    Object.entries(mbti.psi || {}).map(([dim, psi]) => {
                                        return renderMbtiRow(dim[0], dim[1], mbti.traitScores[dim[0]], mbti.traitScores[dim[1]], psi as number);
                                    })
                                ) : (
                                    [['I', 'E'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([left, right]) => {
                                        return renderMbtiRow(left, right, mbti.traitScores?.[left] || 0, mbti.traitScores?.[right] || 0);
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 3: DISC (Bars) */}
                <div className="flex flex-col p-6 rounded-2xl border relative overflow-hidden"
                    style={{ backgroundColor: '#0B1221', borderColor: '#1F2937' }}>
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: '#2563eb' }}></div>
                    <h2 className="text-sm font-bold uppercase tracking-widest mb-8" style={{ color: '#60a5fa' }}>
                        DISC Assessment
                    </h2>

                    {disc && (
                        <div className="flex flex-col h-full">
                            {/* Numbers Row */}
                            <div className="grid grid-cols-4 gap-4 text-center mt-12 mb-12">
                                {['D', 'I', 'S', 'C'].map(dim => (
                                    <div key={dim} className="flex flex-col items-center gap-2">
                                        <span className="text-3xl font-bold" style={{
                                            color: dim === 'D' ? '#ef4444' : dim === 'I' ? '#eab308' : dim === 'S' ? '#22c55e' : '#3b82f6'
                                        }}>
                                            {dim}
                                        </span>
                                        <span className="text-4xl font-black text-white">
                                            {Math.round(disc[dim])}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Bars Stack - Bottom Aligned */}
                            <div className="space-y-6 mt-auto pb-4">
                                {['D', 'I', 'S', 'C'].map(dim => (
                                    <div key={dim} className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold text-[#9ca3af]">
                                            <span>{dim === 'D' ? 'Dominance' : dim === 'I' ? 'Influence' : dim === 'S' ? 'Steadiness' : 'Compliance'}</span>
                                            <span>{Math.round(disc[dim])}/28</span>
                                        </div>

                                        {/* Stylized Progress Bar */}
                                        <div className="h-4 rounded-sm bg-[#1f2937] relative flex items-center px-0">
                                            <div
                                                className="h-4 rounded-sm"
                                                style={{
                                                    width: `${Math.min((disc[dim] / 28) * 100, 100)}%`,
                                                    backgroundColor: dim === 'D' ? '#ef4444' : dim === 'I' ? '#eab308' : dim === 'S' ? '#22c55e' : '#3b82f6'
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer */}
            <div className="absolute bottom-3 right-6 text-[10px] tracking-wider uppercase font-medium text-[#60a5fa]">
                Generated by AI Psychometrics Lab
            </div>
        </div>
    );
});

SummaryCard.displayName = 'SummaryCard';
