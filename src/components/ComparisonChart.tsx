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

export function ComparisonChart({ models }: ComparisonChartProps) {
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
        <div className="w-full h-[400px] flex items-center justify-center p-4">
            <Radar data={data} options={options} />
        </div>
    );
}
