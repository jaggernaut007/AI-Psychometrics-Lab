import { ImageResponse } from 'next/og';
import { getModelProfile } from '@/lib/psychometrics/data';

export const runtime = 'nodejs';
export const alt = 'AI Psychometrics Lab Analysis';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function clampPercent(value: number, max: number): string {
  const ratio = max > 0 ? value / max : 0;
  return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
}

function generateRadarPath(scores: number[], center: { x: number; y: number }, radius: number) {
  const points = scores.map((score, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (score / 120) * radius;
    const x = center.x + Math.cos(angle) * r;
    const y = center.y + Math.sin(angle) * r;
    return `${x},${y}`;
  });
  return points.join(' ');
}

function generateBgPolygon(center: { x: number; y: number }, radius: number) {
  const points = Array.from({ length: 5 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    return `${x},${y}`;
  });
  return points.join(' ');
}

export default async function Image({ params }: { params: Promise<{ model: string }> }) {
  const { model } = await params;
  const modelName = decodeURIComponent(model);

  let profile = null;
  try {
    profile = await getModelProfile(modelName);
  } catch (error) {
    console.error('[OG] Profile fetch error:', error);
  }

  const persona = profile?.persona || 'Base Model';
  const bigFive = profile?.results.bigfive?.traitScores || { N: 50, E: 50, O: 50, A: 50, C: 50 };
  const mbti =
    profile?.results.mbti_derived?.traitScores ||
    profile?.results.mbti?.traitScores || { I: 0, E: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  const mbtiType = profile?.results.mbti_derived?.type || profile?.results.mbti?.type || 'N/A';
  const disc = profile?.results.disc?.traitScores || { D: 0, I: 0, S: 0, C: 0 };
  const darkTriad = profile?.results.darktriad?.traitScores || {
    Machiavellianism: 0,
    Narcissism: 0,
    Psychopathy: 0
  };

  const radarScores: number[] = [
    bigFive.N || 0,
    bigFive.E || 0,
    bigFive.O || 0,
    bigFive.A || 0,
    bigFive.C || 0
  ];
  const radarCenter = { x: 150, y: 150 };
  const radarRadius = 90;

  const mbtiPairs = [
    ['I', 'E'],
    ['S', 'N'],
    ['T', 'F'],
    ['J', 'P']
  ] as const;
  const darkTriadCards = [
    { symbol: 'M', label: 'MACHIAVELLIANISM', score: darkTriad.Machiavellianism || 0, color: '#3b82f6' },
    { symbol: 'N', label: 'NARCISSISM', score: darkTriad.Narcissism || 0, color: '#a855f7' },
    { symbol: 'P', label: 'PSYCHOPATHY', score: darkTriad.Psychopathy || 0, color: '#ef4444' }
  ];

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#050B14',
          color: '#ffffff',
          padding: '30px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
            width: '100%',
            borderBottom: '1px solid #1f2937',
            paddingBottom: 10
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 5 }}>
              {modelName}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{persona} (Aggregated)</span>
              <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#334155' }} />
              <span style={{ fontSize: 12, color: '#475569', letterSpacing: '0.05em' }}>
                PSYCHOMETRIC FINGERPRINT v2.1
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', width: '100%', gap: 20, marginBottom: 20 }}>
          {darkTriadCards.map(({ symbol, label, score, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flex: 1,
                backgroundColor: '#0b1221',
                padding: '12px 15px',
                borderRadius: 8,
                border: '1px solid #1e293b',
                flexDirection: 'column',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    width: 28,
                    height: 28,
                    borderRadius: 4,
                    backgroundColor: `${color}1a`,
                    border: `1px solid ${color}`,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10
                  }}
                >
                  <span style={{ color, fontSize: 14, fontWeight: 700 }}>{symbol}</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                  {label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginRight: 4 }}>
                  {Math.round(score)}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>/100</span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 3,
                  backgroundColor: color,
                  width: clampPercent(score, 100),
                  borderRadius: '0 0 0 8px'
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flex: 1, gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flex: 1,
              backgroundColor: '#0b1221',
              borderRadius: 16,
              border: '1px solid #1e293b',
              padding: 20,
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                width: '100%',
                fontSize: 12,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.1em',
                marginBottom: 10
              }}
            >
              BIG FIVE PROFILE
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: 230,
                position: 'relative'
              }}
            >
              <svg width="230" height="230" viewBox="0 0 300 300">
                {[0.2, 0.4, 0.6, 0.8, 1].map((r) => (
                  <polygon
                    key={r}
                    points={generateBgPolygon(radarCenter, radarRadius * r)}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />
                ))}

                {Array.from({ length: 5 }).map((_, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  return (
                    <line
                      key={i}
                      x1={radarCenter.x}
                      y1={radarCenter.y}
                      x2={radarCenter.x + Math.cos(angle) * radarRadius}
                      y2={radarCenter.y + Math.sin(angle) * radarRadius}
                      stroke="#1e293b"
                      strokeWidth="1"
                    />
                  );
                })}

                <polygon
                  points={generateRadarPath(radarScores, radarCenter, radarRadius)}
                  fill="rgba(59, 130, 246, 0.3)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />

                {radarScores.map((score, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const r = (score / 120) * radarRadius;
                  return (
                    <circle
                      key={i}
                      cx={radarCenter.x + Math.cos(angle) * r}
                      cy={radarCenter.y + Math.sin(angle) * r}
                      r="4"
                      fill="#fff"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  );
                })}

                {['Neuro', 'Extra', 'Open', 'Agree', 'Cons'].map((label, i) => {
                  const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                  const r = radarRadius + 30;
                  const x = radarCenter.x + Math.cos(angle) * r;
                  const y = radarCenter.y + Math.sin(angle) * r;
                  return (
                    <text
                      key={label}
                      x={x}
                      y={y}
                      fill="#94a3b8"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', gap: 6, marginTop: 10 }}>
              {[
                ['Neuro', bigFive.N || 0, '#ef4444', '48%'],
                ['Extra', bigFive.E || 0, '#fbbf24', '48%'],
                ['Open', bigFive.O || 0, '#3b82f6', '48%'],
                ['Agree', bigFive.A || 0, '#a855f7', '48%'],
                ['Cons', bigFive.C || 0, '#10b981', '100%']
              ].map(([label, value, color, width]) => (
                <div
                  key={label as string}
                  style={{
                    display: 'flex',
                    width: width as string,
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #1e293b',
                    paddingBottom: 2
                  }}
                >
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700 }}>{label}</span>
                  <span style={{ color: color as string, fontSize: 11, fontWeight: 700 }}>
                    {Math.round(value as number)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              backgroundColor: '#0b1221',
              borderRadius: 16,
              border: '1px solid #1e293b',
              padding: 20,
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: '#2563eb'
              }}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                fontSize: 12,
                fontWeight: 700,
                color: '#60a5fa',
                letterSpacing: '0.1em',
                marginBottom: 15,
                textTransform: 'uppercase'
              }}
            >
              JUNGIAN TYPE
            </div>

            <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, color: '#3b82f6', lineHeight: 1, marginBottom: 5 }}>
              {mbtiType}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 10,
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: 20
              }}
            >
              ESTIMATED TYPE
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mbtiPairs.map(([left, right]) => {
                const lScore = mbti[left] || 0;
                const rScore = mbti[right] || 0;
                const total = lScore + rScore;
                const ratio = total > 0 ? lScore / total : 0.5;
                const color = left === 'S' ? '#22c55e' : '#3b82f6';
                const psi = ratio < 0.5 ? 1 - ratio : ratio;

                return (
                  <div key={left + right} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#334155', letterSpacing: '0.5px' }}>
                        PSI: {psi.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <span style={{ width: 15, fontWeight: 700, color: ratio >= 0.5 ? '#fff' : '#334155', fontSize: 12 }}>
                        {left}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          backgroundColor: '#1e293b',
                          borderRadius: 3,
                          margin: '0 10px',
                          position: 'relative',
                          display: 'flex',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: ratio >= 0.5 ? color : '#1e293b' }} />
                        <div style={{ width: `${(1 - ratio) * 100}%`, height: '100%', backgroundColor: ratio < 0.5 ? color : '#1e293b' }} />
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: 2,
                            backgroundColor: '#0b1221',
                            transform: 'translateX(-50%)'
                          }}
                        />
                      </div>
                      <span
                        style={{
                          width: 15,
                          fontWeight: 700,
                          color: ratio < 0.5 ? '#fff' : '#334155',
                          fontSize: 12,
                          textAlign: 'right'
                        }}
                      >
                        {right}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              backgroundColor: '#0b1221',
              borderRadius: 16,
              border: '1px solid #1e293b',
              padding: 20,
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: '#2563eb'
              }}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                fontSize: 12,
                fontWeight: 700,
                color: '#60a5fa',
                letterSpacing: '0.1em',
                marginBottom: 15
              }}
            >
              DISC ASSESSMENT
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              {['D', 'I', 'S', 'C'].map((k) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: k === 'D' ? '#ef4444' : k === 'I' ? '#fbbf24' : k === 'S' ? '#10b981' : '#3b82f6',
                      marginBottom: 2
                    }}
                  >
                    {k}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
                    {Math.round(disc[k] || 0)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 25 }}>
              {['Dominance', 'Influence', 'Steadiness', 'Compliance'].map((label) => {
                const key = label[0] as keyof typeof disc;
                const color = key === 'D' ? '#ef4444' : key === 'I' ? '#fbbf24' : key === 'S' ? '#10b981' : '#3b82f6';
                const score = disc[key] || 0;

                return (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#334155',
                        marginBottom: 3
                      }}
                    >
                      <span style={{ textTransform: 'uppercase' }}>{label}</span>
                      <span>{Math.round(score)}/28</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        height: 10,
                        backgroundColor: '#1e293b',
                        borderRadius: 5,
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ width: clampPercent(score, 28), height: '100%', backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 15,
            paddingTop: 10,
            borderTop: '1px solid #1e293b',
            fontSize: 12,
            color: '#64748b',
            fontWeight: 600
          }}
        >
          <div style={{ display: 'flex' }}>
            {new Date().toLocaleDateString()} | explorer/{modelName}
          </div>
          <div style={{ display: 'flex' }}>MADE BY: AI PSYCHOMETRICS LAB</div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
