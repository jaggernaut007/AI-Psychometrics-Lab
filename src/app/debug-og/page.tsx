"use client";

import React from 'react';

// --- SVG RADAR CHART GENERATOR (Copied from opengraph-image.tsx) ---
function generateRadarPath(scores: number[], center: { x: number, y: number }, radius: number) {
    const points = scores.map((score, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const r = (score / 120) * radius;
        const x = center.x + Math.cos(angle) * r;
        const y = center.y + Math.sin(angle) * r;
        return `${x},${y}`;
    });
    return points.join(' ');
}

function generateBgPolygon(center: { x: number, y: number }, radius: number) {
    const points = Array.from({ length: 5 }).map((_, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        return `${x},${y}`;
    });
    return points.join(' ');
}

export default function DebugOGPage() {
    // MOCK DATA matching 'test' or generic
    const modelName = "nvidia/nemotron-3-nano-30b-a3b";
    const persona = "INTJ-Strategist";

    const bigFive = { N: 70, E: 30, O: 80, A: 40, C: 90 };
    const mbti = { I: 80, E: 20, S: 10, N: 90, T: 85, F: 15, J: 75, P: 25 };
    const mbtiType = "INTJ";
    const disc = { D: 20, I: 5, S: 10, C: 25 };
    const darkTriad = { Machiavellianism: 60, Narcissism: 40, Psychopathy: 20 };

    const radarScores = [
        bigFive['N'] || 0,
        bigFive['E'] || 0,
        bigFive['O'] || 0,
        bigFive['A'] || 0,
        bigFive['C'] || 0
    ];
    const radarCenter = { x: 150, y: 150 };
    const radarRadius = 90;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#333' }}>
            {/* CONTAINER simulating 1200x630 */}
            <div style={{
                width: 1200, height: 630, display: 'flex', flexDirection: 'column',
                backgroundColor: '#050B14', color: 'white', fontFamily: 'sans-serif',
                padding: '30px', boxSizing: 'border-box'
            }}>
                {/* HEADLINE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, width: '100%', borderBottom: '1px solid #1F2937', paddingBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 40, fontWeight: 900, marginRight: 15 }}>{modelName}</span>
                        {persona && <span style={{ fontSize: 32, fontWeight: 700, color: '#6b7280' }}>({persona})</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '2px', textTransform: 'uppercase' }}>PSYCHOMETRIC</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '2px', textTransform: 'uppercase' }}>FINGERPRINT</div>
                    </div>
                </div>

                {/* DARK TRIAD ROW */}
                <div style={{ display: 'flex', width: '100%', gap: 20, marginBottom: 20, height: 70 }}>
                    {[{ k: 'Machiavellianism', c: '#3b82f6' }, { k: 'Narcissism', c: '#a855f7' }, { k: 'Psychopathy', c: '#ef4444' }].map(item => (
                        <div key={item.k} style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', padding: 15, borderRadius: 12, border: '1px solid #1e293b', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 5, textTransform: 'uppercase' }}>{item.k}</div>
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginRight: 15, width: 40 }}>{Math.round(darkTriad[item.k as keyof typeof darkTriad] || 0)}</div>
                                <div style={{ flex: 1, height: 6, backgroundColor: '#1f2937', borderRadius: 3 }}>
                                    <div style={{ width: `${Math.min(darkTriad[item.k as keyof typeof darkTriad] || 0, 100)}%`, height: '100%', backgroundColor: item.c, borderRadius: 3 }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* MAIN GRID */}
                <div style={{ display: 'flex', flex: 1, gap: 20 }}>

                    {/* COL 1: BIG FIVE (RADAR) */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2563eb' }} />
                        <div style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '1px', marginBottom: 10, textTransform: 'uppercase' }}>BIG FIVE PROFILE</div>

                        {/* SVG Chart */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 300 }}>
                            <svg width="300" height="300" viewBox="0 0 300 300">
                                {/* Axes Lines */}
                                {[0, 1, 2, 3, 4].map(i => {
                                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                                    const x = radarCenter.x + Math.cos(angle) * radarRadius;
                                    const y = radarCenter.y + Math.sin(angle) * radarRadius;
                                    return <line key={`line-${i}`} x1={radarCenter.x} y1={radarCenter.y} x2={x} y2={y} stroke="#374151" strokeWidth="1" />;
                                })}
                                {/* Base Hexagons */}
                                <polygon points={generateBgPolygon(radarCenter, radarRadius)} fill="none" stroke="#374151" strokeWidth="1" />
                                <polygon points={generateBgPolygon(radarCenter, radarRadius * 0.66)} fill="none" stroke="#374151" strokeWidth="1" />
                                <polygon points={generateBgPolygon(radarCenter, radarRadius * 0.33)} fill="none" stroke="#374151" strokeWidth="1" />

                                {/* Data Polygon */}
                                <polygon points={generateRadarPath(radarScores, radarCenter, radarRadius)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
                                {radarScores.map((score, i) => {
                                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                                    const r = (score / 120) * radarRadius;
                                    const x = radarCenter.x + Math.cos(angle) * r;
                                    const y = radarCenter.y + Math.sin(angle) * r;
                                    return <circle key={`dot-${i}`} cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="1" />;
                                })}

                                {/* Labels */}
                                <text x="150" y="40" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="700">Neuroticism</text>
                                <text x="260" y="110" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="700">Extraversion</text>
                                <text x="240" y="270" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="700">Openness</text>
                                <text x="60" y="270" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="700">Agreeableness</text>
                                <text x="40" y="110" textAnchor="middle" fill="#9ca3af" fontSize="10" fontWeight="700">Conscientiousness</text>
                            </svg>
                        </div>
                        {/* Text Scores */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: 12, marginTop: 'auto', borderTop: '1px solid #1f2937', paddingTop: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                {['Neuroticism', 'Openness', 'Conscientiousness'].map((k, i) => (
                                    <div key={k} style={{ display: 'flex', gap: 5 }}><span style={{ color: '#9ca3af' }}>{k}</span><span style={{ color: '#fff', fontWeight: 700 }}>{Math.round(radarScores[i * 2] || 0)}</span></div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'right' }}>
                                {['Extraversion', 'Agreeableness'].map((k, i) => (
                                    <div key={k} style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}><span style={{ color: '#9ca3af' }}>{k}</span><span style={{ color: '#fff', fontWeight: 700 }}>{Math.round(radarScores[i * 2 + 1] || 0)}</span></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COL 2: MBTI */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2563eb' }} />
                        <div style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '1px', marginBottom: 20, textTransform: 'uppercase' }}>JUNGIAN TYPE</div>

                        <div style={{ fontSize: 80, fontWeight: 900, color: '#3b82f6', lineHeight: 1, marginBottom: 5 }}>{mbtiType}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 40 }}>Estimated Type</div>

                        {/* Slider Bars */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {[['I', 'E'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([L, R]) => { // Fixed order
                                const lScore = mbti[L as keyof typeof mbti] || 0;
                                const rScore = mbti[R as keyof typeof mbti] || 0;
                                const total = lScore + rScore;
                                const ratio = total > 0 ? lScore / total : 0.5;
                                let color = '#3b82f6';
                                if (L === 'S') color = '#22c55e'; // Green for Sensing/Tuition

                                return (
                                    <div key={L + R} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <span style={{ width: 15, fontWeight: 700, color: ratio >= 0.5 ? '#fff' : '#64748b', fontSize: 12 }}>{L}</span>
                                        <div style={{ flex: 1, height: 6, backgroundColor: '#1f2937', borderRadius: 3, margin: '0 10px', position: 'relative', display: 'flex' }}>
                                            {/* Start Bar */}
                                            <div style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: ratio >= 0.5 ? color : '#1f2937', borderRadius: '3px 0 0 3px' }} />
                                            {/* End Bar */}
                                            <div style={{ width: `${(1 - ratio) * 100}%`, height: '100%', backgroundColor: ratio < 0.5 ? color : '#1f2937', borderRadius: '0 3px 3px 0' }} />
                                        </div>
                                        <span style={{ width: 15, fontWeight: 700, color: ratio < 0.5 ? '#fff' : '#64748b', fontSize: 12, textAlign: 'right' }}>{R}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* COL 3: DISC */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2563eb' }} />
                        <div style={{ width: '100%', fontSize: 12, fontWeight: 700, color: '#60a5fa', letterSpacing: '1px', marginBottom: 20, textTransform: 'uppercase' }}>DISC ASSESSMENT</div>

                        {/* Values */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                            {['D', 'I', 'S', 'C'].map(k => (
                                <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 24, fontWeight: 900, color: k === 'D' ? '#ef4444' : k === 'I' ? '#eab308' : k === 'S' ? '#22c55e' : '#3b82f6', marginBottom: 5 }}>{k}</span>
                                    <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{Math.round(disc[k as keyof typeof disc] || 0)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Bars moved to bottom */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                            {['Dominance', 'Influence', 'Steadiness', 'Compliance'].map((label, i) => {
                                const key = label[0];
                                const color = key === 'D' ? '#ef4444' : key === 'I' ? '#eab308' : key === 'S' ? '#22c55e' : '#3b82f6';
                                const val = disc[key as keyof typeof disc] || 0;
                                return (
                                    <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                                            <span>{label}</span>
                                            <span>{Math.round(val)}/28</span>
                                        </div>
                                        <div style={{ width: '100%', height: 8, backgroundColor: '#1f2937', borderRadius: 4 }}>
                                            <div style={{ width: `${(val / 28) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, paddingTop: 10, borderTop: '1px solid #1F2937', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    <div>
                        {new Date().getFullYear()} • explorer/{modelName}
                    </div>
                    <div style={{ color: '#60a5fa' }}>
                        MADE BY: AI PSYCHOMETRICS LAB
                    </div>
                </div>

            </div>
        </div>
    );
}
