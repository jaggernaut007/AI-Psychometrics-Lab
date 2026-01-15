import { ImageResponse } from 'next/og';
import { getModelProfile } from '@/lib/psychometrics/data';

export const runtime = 'nodejs';

export const alt = 'AI Psychometrics Lab Analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// --- DATA HELPERS ---

function normalize(score: number, max: number = 120) {
    return Math.min(Math.max(score / max, 0), 1);
}

// --- SVG RADAR CHART GENERATOR ---
function generateRadarPath(scores: number[], center: { x: number, y: number }, radius: number) {
    // Order: O, C, E, A, N (or matching the visual: N, E, O, A, C usually? Let's assume N at top)
    // Visual in chart: Neuroticism (top), Extraversion (right-top), Openness (right-bottom), Agreeableness (left-bottom), Conscientiousness (left-top)
    // Angles: 0, 72, 144, 216, 288 (minus 90 degrees to start at top)

    // Mapping scores to radius (0 to 100 scale usually for Big 5 in this app? Profile has raw scores. Assume 0-120 range)
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


export default async function Image({ params }: { params: Promise<{ model: string }> }) {
    // --- DEBUG OVERRIDE ---
    // Uncomment this to force a simple render for testing Vercel connectivity
    const DEBUG_MODE = false;
    if (DEBUG_MODE) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 40,
                        color: 'black',
                        background: 'white',
                        width: '100%',
                        height: '100%',
                        padding: '50px 200px',
                        textAlign: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        display: 'flex',
                    }}
                >
                    <div>Hello World - Debugging Vercel 500 Error</div>
                </div>
            ),
            {
                ...size,
            }
        );
    }
    // ----------------------

    const { model } = await params;

    // MOCK DATA FALLBACK vs REAL DATA
    // We try to fetch. If it fails (null), we use MOCK data to ensure the visual generates for testing.
    let modelName = decodeURIComponent(model);
    console.log(`[OG] Generating for model: ${modelName}`);

    let profile = null;
    try {
        console.log('[OG] Fetching profile...');
        profile = await getModelProfile(modelName);
        console.log(`[OG] Profile fetched: ${profile ? 'Found' : 'Null'}`);
    } catch (e) {
        console.error('[OG] Profile fetch error:', e);
    }

    // Fallback/Default values
    const bigFive = profile?.results['bigfive']?.traitScores || { N: 50, E: 50, O: 50, A: 50, C: 50 };
    const mbti = profile?.results['mbti_derived']?.traitScores || profile?.results['mbti']?.traitScores || { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const mbtiType = profile?.results['mbti_derived']?.type || profile?.results['mbti']?.type || 'N/A';
    const disc = profile?.results['disc']?.traitScores || { D: 0, I: 0, S: 0, C: 0 };
    const darkTriad = profile?.results['darktriad']?.traitScores || { Machiavellianism: 0, Narcissism: 0, Psychopathy: 0 };

    // Big Five Radar Data (N, E, O, A, C for the visual order)
    const radarScores = [
        bigFive['N'] || 0,
        bigFive['E'] || 0,
        bigFive['O'] || 0,
        bigFive['A'] || 0,
        bigFive['C'] || 0
    ];
    const radarCenter = { x: 150, y: 150 };
    const radarRadius = 90;

    // Font Loading
    let interSemiBold: ArrayBuffer | null = null;
    // DISABLED FOR DEBUGGING STEP 2: Verify Data Fetching Works First
    try {
        console.log('[OG] Fetching Font...');
        const response = await fetch('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZs.woff');
        if (response.ok) {
            interSemiBold = await response.arrayBuffer();
            console.log('[OG] Font fetched successfully');
        } else {
            console.error('[OG] Failed to fetch font:', response.statusText);
            throw new Error(`Font fetch failed: ${response.statusText}`);
        }
    } catch (e) {
        console.error('[OG] Error fetching font:', e);
        throw e; // Fail hard so we see the error in logs instead of blank image
    }


    return new ImageResponse(
        (
            <div style={{
                height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
                backgroundColor: '#050B14', color: 'white',
                fontFamily: '"Inter", sans-serif',
                padding: '30px'
            }}>
                {/* HEADLINE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15, width: '100%', borderBottom: '1px solid #1F2937', paddingBottom: 15 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 48, fontWeight: 600, marginRight: 15 }}>{modelName}</span>
                            <span style={{ fontSize: 32, fontWeight: 600, color: '#6b7280' }}>(Average)</span>
                            <span style={{ fontSize: 32, fontWeight: 600, color: '#374151', marginLeft: 15 }}>(Base Model)</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.1em' }}>PSYCHOMETRIC</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.1em' }}>FINGERPRINT</div>
                    </div>
                </div>

                {/* DARK TRIAD ROW */}
                <div style={{ display: 'flex', width: '100%', gap: 20, marginBottom: 20 }}>
                    {/* Mach */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>MACHIAVELLIANISM</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 10 }}>
                            <span style={{ fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1, marginRight: 5 }}>{Math.round(darkTriad.Machiavellianism)}</span>
                            <span style={{ fontSize: 16, color: '#64748b', marginBottom: 4 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3 }}>
                            <div style={{ width: `${Math.min(darkTriad.Machiavellianism, 100)}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 }} />
                        </div>
                    </div>
                    {/* Narc */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>NARCISSISM</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 10 }}>
                            <span style={{ fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1, marginRight: 5 }}>{Math.round(darkTriad.Narcissism)}</span>
                            <span style={{ fontSize: 16, color: '#64748b', marginBottom: 4 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3 }}>
                            <div style={{ width: `${Math.min(darkTriad.Narcissism, 100)}%`, height: '100%', backgroundColor: '#a855f7', borderRadius: 3 }} />
                        </div>
                    </div>
                    {/* Psych */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0f172a', padding: 20, borderRadius: 12, border: '1px solid #1e293b', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>PSYCHOPATHY</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 10 }}>
                            <span style={{ fontSize: 36, fontWeight: 600, color: '#fff', lineHeight: 1, marginRight: 5 }}>{Math.round(darkTriad.Psychopathy)}</span>
                            <span style={{ fontSize: 16, color: '#64748b', marginBottom: 4 }}>/100</span>
                        </div>
                        <div style={{ display: 'flex', width: '100%', height: 6, backgroundColor: '#1e293b', borderRadius: 3 }}>
                            <div style={{ width: `${Math.min(darkTriad.Psychopathy, 100)}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: 3 }} />
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div style={{ display: 'flex', flex: 1, gap: 20 }}>
                    {/* COL 1: BIG FIVE (RADAR) */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0f172a', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ display: 'flex', width: '100%', fontSize: 14, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 20 }}>BIG FIVE PROFILE</div>

                        {/* SVG Chart */}
                        {/* SVG Chart */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: 300, position: 'relative' }}>
                            <svg width="300" height="300" viewBox="0 0 300 300">
                                {/* Background Hexagons */}
                                <polygon points={generateBgPolygon(radarCenter, radarRadius)} fill="none" stroke="#334155" strokeWidth="1" />
                                <polygon points={generateBgPolygon(radarCenter, radarRadius * 0.75)} fill="none" stroke="#1e293b" strokeWidth="1" />
                                <polygon points={generateBgPolygon(radarCenter, radarRadius * 0.5)} fill="none" stroke="#1e293b" strokeWidth="1" />
                                <polygon points={generateBgPolygon(radarCenter, radarRadius * 0.25)} fill="none" stroke="#1e293b" strokeWidth="1" />

                                {/* Axes */}
                                {[0, 1, 2, 3, 4].map(i => {
                                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                                    const x = radarCenter.x + Math.cos(angle) * radarRadius;
                                    const y = radarCenter.y + Math.sin(angle) * radarRadius;
                                    return <line key={i} x1={radarCenter.x} y1={radarCenter.y} x2={x} y2={y} stroke="#334155" strokeWidth="1" />;
                                })}

                                {/* Data Polygon */}
                                <polygon points={generateRadarPath(radarScores, radarCenter, radarRadius)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />

                                {/* Points */}
                                {radarScores.map((score, i) => {
                                    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                                    const r = (score / 120) * radarRadius;
                                    const x = radarCenter.x + Math.cos(angle) * r;
                                    const y = radarCenter.y + Math.sin(angle) * r;
                                    return <circle key={i} cx={x} cy={y} r="3" fill="#60a5fa" />;
                                })}

                            </svg>

                            {/* LABELS (Overlay Divs for Satori Support) */}
                            {/* Neuroticism (Top) */}
                            <div style={{ position: 'absolute', top: 30, left: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Neuroticism</span>
                            </div>
                            {/* Extraversion (Top Right) */}
                            <div style={{ position: 'absolute', top: 100, left: 230, display: 'flex' }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Extraversion</span>
                            </div>
                            {/* Openness (Bottom Right) */}
                            <div style={{ position: 'absolute', top: 260, left: 200, display: 'flex' }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Openness</span>
                            </div>
                            {/* Agreeableness (Bottom Left) */}
                            <div style={{ position: 'absolute', top: 260, left: 40, display: 'flex' }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Agreeableness</span>
                            </div>
                            {/* Conscientiousness (Top Left) */}
                            <div style={{ position: 'absolute', top: 100, left: 10, display: 'flex' }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>Conscientiousness</span>
                            </div>
                        </div>

                    </div>

                    {/* COL 2: MBTI */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2563eb' }} />
                        <div style={{ width: '100%', fontSize: 12, fontWeight: 600, color: '#60a5fa', letterSpacing: '1px', marginBottom: 20, textTransform: 'uppercase' }}>JUNGIAN TYPE</div>

                        <div style={{ display: 'flex', fontSize: 80, fontWeight: 600, color: '#3b82f6', lineHeight: 1, marginBottom: 5 }}>{mbtiType}</div>
                        <div style={{ display: 'flex', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 40 }}>Estimated Type</div>

                        {/* Slider Bars */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 15 }}>
                            {[['I', 'E'], ['S', 'N'], ['T', 'F'], ['J', 'P']].map(([L, R]) => {
                                const lScore = mbti[L as keyof typeof mbti] || 0;
                                const rScore = mbti[R as keyof typeof mbti] || 0;
                                const total = lScore + rScore;
                                const ratio = total > 0 ? lScore / total : 0.5;
                                let color = '#3b82f6';
                                if (L === 'S') color = '#22c55e';

                                return (
                                    <div key={L + R} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                        <span style={{ width: 15, fontWeight: 600, color: ratio >= 0.5 ? '#fff' : '#64748b', fontSize: 12 }}>{L}</span>
                                        <div style={{ flex: 1, height: 6, backgroundColor: '#1f2937', borderRadius: 3, margin: '0 10px', position: 'relative', display: 'flex' }}>
                                            <div style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: ratio >= 0.5 ? color : '#1f2937', borderRadius: '3px 0 0 3px' }} />
                                            <div style={{ width: `${(1 - ratio) * 100}%`, height: '100%', backgroundColor: ratio < 0.5 ? color : '#1f2937', borderRadius: '0 3px 3px 0' }} />
                                        </div>
                                        <span style={{ width: 15, fontWeight: 600, color: ratio < 0.5 ? '#fff' : '#64748b', fontSize: 12, textAlign: 'right' }}>{R}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* COL 3: DISC */}
                    <div style={{ display: 'flex', flex: 1, backgroundColor: '#0B1221', borderRadius: 16, border: '1px solid #1e293b', padding: 20, flexDirection: 'column', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#2563eb' }} />
                        <div style={{ width: '100%', fontSize: 12, fontWeight: 600, color: '#60a5fa', letterSpacing: '1px', marginBottom: 20, textTransform: 'uppercase' }}>DISC ASSESSMENT</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
                            {['D', 'I', 'S', 'C'].map(k => (
                                <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span style={{ fontSize: 24, fontWeight: 600, color: k === 'D' ? '#ef4444' : k === 'I' ? '#eab308' : k === 'S' ? '#22c55e' : '#3b82f6', marginBottom: 5 }}>{k}</span>
                                    <span style={{ fontSize: 28, fontWeight: 600, color: '#fff' }}>{Math.round(disc[k as keyof typeof disc] || 0)}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                            {['Dominance', 'Influence', 'Steadiness', 'Compliance'].map((label, i) => {
                                const key = label[0];
                                const color = key === 'D' ? '#ef4444' : key === 'I' ? '#eab308' : key === 'S' ? '#22c55e' : '#3b82f6';
                                return (
                                    <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                                            <span>{label}</span>
                                            <span>{Math.round(disc[key] || 0)}/28</span>
                                        </div>
                                        <div style={{ display: 'flex', width: '100%', height: 10, backgroundColor: '#1e293b', borderRadius: 5 }}>
                                            <div style={{ width: `${(disc[key] / 28) * 100}%`, height: '100%', backgroundColor: color, borderRadius: 5 }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, paddingTop: 10, borderTop: '1px solid #1e293b', fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                    <div>
                        {new Date().toLocaleDateString()} • explorer/{modelName}
                    </div>
                    <div>
                        MADE BY: AI PSYCHOMETRICS LAB
                    </div>
                </div>

            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interSemiBold!,
                    style: 'normal',
                    weight: 600,
                },
            ],
        }
    );
}
