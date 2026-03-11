/**
 * Model registry mapping hardware tiers to recommended local models.
 * Used by the recommend_local_model tool.
 * @author Shreyas Jagannath
 */
import type { SystemSpecs } from './system-specs.js';

export type QualityTier = 'low' | 'medium' | 'high';

export interface ModelRecommendation {
    model: string;
    displayName: string;
    parameterCount: string;
    quality: QualityTier;
    estimatedTokensPerSec: number;
    ramRequired: number;
    gpuRequired: boolean;
    vramRequired: number;
    notes: string;
}

const MODEL_REGISTRY: ModelRecommendation[] = [
    {
        model: 'llama3.2:3b',
        displayName: 'Llama 3.2 3B Instruct',
        parameterCount: '3B',
        quality: 'low',
        estimatedTokensPerSec: 30,
        ramRequired: 4,
        gpuRequired: false,
        vramRequired: 0,
        notes: 'Fast, lightweight model suitable for basic assessments on low-end hardware.',
    },
    {
        model: 'phi3:mini',
        displayName: 'Phi-3 Mini',
        parameterCount: '3.8B',
        quality: 'low',
        estimatedTokensPerSec: 25,
        ramRequired: 4,
        gpuRequired: false,
        vramRequired: 0,
        notes: 'Microsoft Phi-3 mini, strong reasoning for its size.',
    },
    {
        model: 'llama3.1:8b',
        displayName: 'Llama 3.1 8B Instruct',
        parameterCount: '8B',
        quality: 'medium',
        estimatedTokensPerSec: 15,
        ramRequired: 10,
        gpuRequired: false,
        vramRequired: 0,
        notes: 'Good balance of quality and speed. Works well on 16GB RAM systems.',
    },
    {
        model: 'mistral:7b',
        displayName: 'Mistral 7B Instruct',
        parameterCount: '7B',
        quality: 'medium',
        estimatedTokensPerSec: 18,
        ramRequired: 10,
        gpuRequired: false,
        vramRequired: 0,
        notes: 'Efficient 7B model with strong instruction following.',
    },
    {
        model: 'llama3.1:8b',
        displayName: 'Llama 3.1 8B Instruct (GPU)',
        parameterCount: '8B',
        quality: 'medium',
        estimatedTokensPerSec: 60,
        ramRequired: 10,
        gpuRequired: true,
        vramRequired: 8,
        notes: 'GPU-accelerated for significantly faster inference.',
    },
    {
        model: 'mixtral:8x7b',
        displayName: 'Mixtral 8x7B',
        parameterCount: '47B (MoE)',
        quality: 'high',
        estimatedTokensPerSec: 10,
        ramRequired: 32,
        gpuRequired: false,
        vramRequired: 0,
        notes: 'Mixture-of-experts model. High quality but requires significant RAM.',
    },
    {
        model: 'llama3.1:70b-instruct-q4_K_M',
        displayName: 'Llama 3.1 70B Instruct (Q4)',
        parameterCount: '70B',
        quality: 'high',
        estimatedTokensPerSec: 5,
        ramRequired: 40,
        gpuRequired: true,
        vramRequired: 16,
        notes: 'Quantized 70B model. Best quality for psychometric assessments. Needs 16GB+ VRAM.',
    },
];

export function recommendModels(
    specs: SystemSpecs,
    options?: { task?: string; minQuality?: QualityTier }
): ModelRecommendation[] {
    const qualityOrder: Record<QualityTier, number> = { low: 0, medium: 1, high: 2 };
    const minQualityLevel = qualityOrder[options?.minQuality ?? 'low'];

    const hasGPU = specs.gpu !== null;
    const vram = specs.gpu?.vram_gb ?? 0;

    const eligible = MODEL_REGISTRY.filter(model => {
        // Check RAM requirement
        if (specs.ram_gb < model.ramRequired) return false;

        // Check GPU requirement
        if (model.gpuRequired && (!hasGPU || vram < model.vramRequired)) return false;

        // Check quality floor
        if (qualityOrder[model.quality] < minQualityLevel) return false;

        return true;
    });

    // Sort by quality descending, then tokens/sec descending
    eligible.sort((a, b) => {
        const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
        if (qualityDiff !== 0) return qualityDiff;
        return b.estimatedTokensPerSec - a.estimatedTokensPerSec;
    });

    // Deduplicate by model name (keep the better-performing variant)
    const seen = new Set<string>();
    const deduplicated: ModelRecommendation[] = [];
    for (const rec of eligible) {
        // Use model + gpuRequired as key to keep GPU and CPU variants separate
        const key = `${rec.model}-gpu:${rec.gpuRequired}`;
        // If GPU variant is eligible and non-GPU variant also exists, prefer GPU
        if (!seen.has(rec.model) || (rec.gpuRequired && hasGPU)) {
            if (seen.has(rec.model)) {
                // Remove the non-GPU variant
                const idx = deduplicated.findIndex(d => d.model === rec.model && !d.gpuRequired);
                if (idx !== -1) deduplicated.splice(idx, 1);
            }
            seen.add(rec.model);
            if (!deduplicated.some(d => d.model === rec.model)) {
                deduplicated.push(rec);
            }
        }
    }

    return deduplicated;
}
