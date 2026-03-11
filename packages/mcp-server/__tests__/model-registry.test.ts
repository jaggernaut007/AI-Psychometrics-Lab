/**
 * Tests for model recommendation registry.
 * @author Shreyas Jagannath
 */
import { describe, it, expect } from 'vitest';
import { recommendModels } from '../src/utils/model-registry.js';
import type { SystemSpecs } from '../src/utils/system-specs.js';

const lowEndSpecs: SystemSpecs = {
    ram_gb: 8,
    cpu_cores: 4,
    cpu_model: 'Intel Core i5',
    gpu: null,
    os: 'darwin',
    arch: 'x64',
};

const midRangeSpecs: SystemSpecs = {
    ram_gb: 16,
    cpu_cores: 8,
    cpu_model: 'Apple M1',
    gpu: { name: 'Apple M1', vram_gb: 16 },
    os: 'darwin',
    arch: 'arm64',
};

const highEndSpecs: SystemSpecs = {
    ram_gb: 64,
    cpu_cores: 16,
    cpu_model: 'AMD Ryzen 9',
    gpu: { name: 'NVIDIA RTX 4090', vram_gb: 24 },
    os: 'linux',
    arch: 'x64',
};

describe('Model Registry', () => {
    it('should recommend lightweight models for 8GB RAM, no GPU', () => {
        const recs = recommendModels(lowEndSpecs);
        expect(recs.length).toBeGreaterThan(0);
        // Should only include models that need <= 8GB RAM and no GPU
        for (const rec of recs) {
            expect(rec.ramRequired).toBeLessThanOrEqual(8);
            if (rec.gpuRequired) {
                expect(lowEndSpecs.gpu).not.toBeNull();
            }
        }
    });

    it('should recommend more models for 16GB RAM with GPU', () => {
        const recs = recommendModels(midRangeSpecs);
        expect(recs.length).toBeGreaterThan(recommendModels(lowEndSpecs).length);
    });

    it('should recommend high quality models for high-end specs', () => {
        const recs = recommendModels(highEndSpecs);
        const highQuality = recs.filter(r => r.quality === 'high');
        expect(highQuality.length).toBeGreaterThan(0);
    });

    it('should filter by minimum quality tier', () => {
        const recs = recommendModels(highEndSpecs, { minQuality: 'high' });
        for (const rec of recs) {
            expect(rec.quality).toBe('high');
        }
    });

    it('should return empty array when hardware is too limited', () => {
        const tinySpecs: SystemSpecs = {
            ram_gb: 2,
            cpu_cores: 2,
            cpu_model: 'Unknown',
            gpu: null,
            os: 'linux',
            arch: 'x64',
        };
        const recs = recommendModels(tinySpecs);
        expect(recs.length).toBe(0);
    });

    it('should sort results by quality descending', () => {
        const recs = recommendModels(highEndSpecs);
        const qualityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
        for (let i = 1; i < recs.length; i++) {
            expect(qualityOrder[recs[i - 1].quality]).toBeGreaterThanOrEqual(qualityOrder[recs[i].quality]);
        }
    });
});
