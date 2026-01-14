'use client';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface MetricBarChartProps {
    metricName: string;
    description?: string;
    models: Array<{
        id: string;
        name: string;
        persona?: string;
        value: number;
        color: string;
    }>;
    maxValue: number; // 120 for Big5, 100 for others
}

import { Download } from 'lucide-react';
import React, { useRef, useState } from 'react';

export function MetricBarChart({ metricName, description, models, maxValue }: MetricBarChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

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
                link.download = `metric-analysis-${metricName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
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
        labels: models.map(m => m.persona && m.persona !== 'Base Model' ? `${m.name} (${m.persona})` : m.name),
        datasets: [
            {
                label: metricName,
                data: models.map(m => m.value),
                backgroundColor: models.map(m => m.color),
                borderColor: models.map(m => m.color.replace('0.5', '1')),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: maxValue,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
    };

    return (
        <div ref={chartRef} className="w-full h-full p-4 bg-white rounded-lg border border-gray-100 flex flex-col justify-between">
            <div className="mb-2">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div>
                            <h4 className="text-lg font-bold text-gray-800">{metricName}</h4>
                            {description && <p className="text-sm text-gray-500">{description}</p>}
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            data-ignore-download="true"
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors ml-1"
                            title="Download Chart Image"
                        >
                            {isDownloading ? <span className="text-xs animate-spin">⏳</span> : <Download className="w-4 h-4" />}
                        </button>
                    </div>
                    <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest text-right leading-tight text-indigo-600 mt-1">
                        Metric<br />Analysis
                    </div>
                </div>
            </div>

            <div className="flex-grow min-h-[200px]">
                <Bar data={data} options={options} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 py-2 mt-4">
                <div className="text-[10px] tracking-widest uppercase font-medium text-gray-500">
                    {new Date().toLocaleDateString()}
                </div>
                <div className="text-[10px] tracking-wider uppercase font-bold text-indigo-500">
                    Made by: AI Psychometrics Lab
                </div>
            </div>
        </div>
    );
}
