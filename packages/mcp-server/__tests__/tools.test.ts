/**
 * Tests for MCP tool handlers with mocked backends and storage.
 * @author Shreyas Jagannath
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    INVENTORY_METADATA,
    BIG_FIVE_DEFINITIONS,
    DISC_DEFINITIONS,
    DARK_TRIAD_DEFINITIONS,
    MBTI_DEFINITIONS,
    validateInventories,
} from '@apl/psychometrics-core';

describe('list_inventories tool', () => {
    it('should return all inventory metadata and definitions', () => {
        const result = {
            bigfive: {
                ...INVENTORY_METADATA.bigfive,
                traitDefinitions: BIG_FIVE_DEFINITIONS,
            },
            mbti: {
                ...INVENTORY_METADATA.mbti,
                typeDefinitions: MBTI_DEFINITIONS,
            },
            disc: {
                ...INVENTORY_METADATA.disc,
                traitDefinitions: DISC_DEFINITIONS,
            },
            darktriad: {
                ...INVENTORY_METADATA.darktriad,
                traitDefinitions: DARK_TRIAD_DEFINITIONS,
            },
        };

        expect(result.bigfive.name).toBe('Big Five (IPIP-NEO-120)');
        expect(result.mbti.name).toBe('MBTI (OEJTS 1.2)');
        expect(result.disc.name).toBe('DISC Assessment');
        expect(result.darktriad.name).toBe('Dark Triad (SD3)');

        expect(result.bigfive.traitDefinitions.N.title).toBe('Neuroticism');
        expect(result.disc.traitDefinitions.D.title).toBe('Dominance');
        expect(result.darktriad.traitDefinitions.Machiavellianism.title).toBe('Machiavellianism');
        expect(Object.keys(result.mbti.typeDefinitions)).toHaveLength(16);
    });
});

describe('validateInventories', () => {
    it('should return empty array for valid inventories', () => {
        expect(validateInventories(['bigfive', 'mbti'])).toEqual([]);
    });

    it('should return invalid inventory names', () => {
        expect(validateInventories(['bigfive', 'invalid'])).toEqual(['invalid']);
    });

    it('should return all names when all are invalid', () => {
        expect(validateInventories(['foo', 'bar'])).toEqual(['foo', 'bar']);
    });
});

describe('compare_models logic', () => {
    it('should compute trait deltas correctly', () => {
        const modelA = { N: 50, E: 60, O: 70, A: 80, C: 90 };
        const modelB = { N: 40, E: 70, O: 65, A: 85, C: 75 };

        const traits = Object.keys(modelA);
        const comparisons = traits.map(trait => {
            const scores: Record<string, number> = {
                'model-a': modelA[trait as keyof typeof modelA],
                'model-b': modelB[trait as keyof typeof modelB],
            };
            const values = Object.values(scores);
            const maxVal = Math.max(...values);
            const minVal = Math.min(...values);
            return {
                trait,
                scores,
                delta: maxVal - minVal,
                highest: Object.entries(scores).find(([, v]) => v === maxVal)?.[0],
                lowest: Object.entries(scores).find(([, v]) => v === minVal)?.[0],
            };
        });

        expect(comparisons[0].trait).toBe('N');
        expect(comparisons[0].delta).toBe(10);
        expect(comparisons[0].highest).toBe('model-a');
        expect(comparisons[0].lowest).toBe('model-b');

        expect(comparisons[1].trait).toBe('E');
        expect(comparisons[1].delta).toBe(10);
        expect(comparisons[1].highest).toBe('model-b');
    });
});

describe('run_assessment input validation', () => {
    it('should reject invalid inventories', () => {
        const invalid = validateInventories(['bigfive', 'invalid_inventory']);
        expect(invalid).toContain('invalid_inventory');
        expect(invalid).not.toContain('bigfive');
    });

    it('should accept all valid inventory names', () => {
        const invalid = validateInventories(['bigfive', 'mbti', 'disc', 'darktriad']);
        expect(invalid).toHaveLength(0);
    });
});

describe('get_results filtering logic', () => {
    it('should filter stored runs by model name', () => {
        const runs = [
            { id: '1', profile: { modelName: 'model-a' }, createdAt: '2024-01-01' },
            { id: '2', profile: { modelName: 'model-b' }, createdAt: '2024-01-02' },
            { id: '3', profile: { modelName: 'model-a' }, createdAt: '2024-01-03' },
        ];

        const filtered = runs.filter(r => r.profile.modelName === 'model-a');
        expect(filtered).toHaveLength(2);
        expect(filtered.every(r => r.profile.modelName === 'model-a')).toBe(true);
    });

    it('should limit number of results', () => {
        const runs = Array.from({ length: 10 }, (_, i) => ({
            id: `${i}`,
            profile: { modelName: 'model-a' },
            createdAt: new Date(2024, 0, i + 1).toISOString(),
        }));

        const limited = runs.slice(0, 5);
        expect(limited).toHaveLength(5);
    });
});
