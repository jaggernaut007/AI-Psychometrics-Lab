'use client';

import React from 'react';
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

interface ComparisonChartProps {
    models: Array<{
        id: string;
        name: string;
        persona: string;
        scores: Record<string, number>; // Big Five: O, C, E, A, N
    }>;
}

const TRAIT_LABELS = {
    'O': 'Openness',
    'C': 'Conscientiousness',
    'E': 'Extraversion',
    'A': 'Agreeableness',
    'N': 'Neuroticism'
};

const CHART_COLORS = [
    'rgba(255, 99, 132, 1)',   // Red
    'rgba(54, 162, 235, 1)',   // Blue
    'rgba(255, 206, 86, 1)',   // Yellow
    'rgba(75, 192, 192, 1)',   // Teal
    'rgba(153, 102, 255, 1)',  // Purple
    'rgba(255, 159, 64, 1)',   // Orange
];

const CHART_BG_COLORS = [
    'rgba(255, 99, 132, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(75, 192, 192, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)',
];

import { Download } from 'lucide-react';

export function ComparisonChart({ models }: ComparisonChartProps) {
    const [dateString, setDateString] = React.useState('');
    const chartRef = React.useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);

    React.useEffect(() => {
        setDateString(new Date().toLocaleDateString());
    }, []);

    const handleDownload = async () => {
        if (!chartRef.current) return;
        setIsDownloading(true);
        try {
            const htmlToImage = await import('html-to-image');
            const blob = await htmlToImage.toBlob(chartRef.current, {
                backgroundColor: '#ffffff',
                quality: 0.95,
                cacheBust: true,
                filter: (node) => {
                    // Exclude elements with the 'data-ignore-download' attribute
                    return node.tagName !== 'BUTTON' && !(node as HTMLElement).hasAttribute?.('data-ignore-download');
                }
            });

            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `psychometric-comparison-${new Date().toISOString().split('T')[0]}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to download image:', err);
            alert('Failed to download chart image.');
        } finally {
            setIsDownloading(false);
        }
    };

    const data = {
        labels: Object.values(TRAIT_LABELS),
        datasets: models.map((model, index) => {
            const color = CHART_COLORS[index % CHART_COLORS.length];
            const bgColor = CHART_BG_COLORS[index % CHART_BG_COLORS.length];

            return {
                label: model.persona === 'Base Model' ? model.name : `${model.name} (${model.persona})`,
                data: [
                    model.scores['O'] || 0,
                    model.scores['C'] || 0,
                    model.scores['E'] || 0,
                    model.scores['A'] || 0,
                    model.scores['N'] || 0,
                ],
                backgroundColor: bgColor,
                borderColor: color,
                borderWidth: 2,
                pointBackgroundColor: color,
            };
        }),
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                },
                suggestedMin: 0,
                suggestedMax: 120, // Max score is usually around 120
                ticks: {
                    stepSize: 20,
                    backdropColor: 'transparent',
                },
                pointLabels: {
                    font: {
                        size: 12,
                        weight: 'bold' as const, // Explicitly cast to prevent type error
                    },
                },
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        maintainAspectRatio: false,
    };

    if (models.length === 0) return null;

    return (
        <div ref={chartRef} className="w-full h-full flex flex-col justify-between bg-white p-2">
            {/* Header */}
            <div className="flex justify-between items-end mb-4 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-800">Big Five Constellation</h3>
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        data-ignore-download="true"
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Download Chart Image"
                    >
                        {isDownloading ? <span className="text-xs animate-spin">⏳</span> : <Download className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-right leading-tight text-indigo-600">
                    Psychometric<br />Comparison
                </div>
            </div>

            <div className="flex-grow w-full min-h-[300px] relative">
                <Radar data={data} options={options} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 py-2 mt-4">
                <div className="text-[10px] tracking-widest uppercase font-medium text-gray-500">
                    {dateString}
                </div>
                <div className="text-[10px] tracking-wider uppercase font-bold text-indigo-500">
                    Made by: AI Psychometrics Lab
                </div>
            </div>
        </div>
    );
}
