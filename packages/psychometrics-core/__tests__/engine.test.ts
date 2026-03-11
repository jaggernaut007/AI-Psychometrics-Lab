import { describe, it, expect, vi } from 'vitest';
import {
    buildPrompt,
    parseResponse,
    collectItems,
    validateInventories,
    runAssessment,
} from '../src/engine';
import type { InventoryItem, LLMBackend, DISCItem } from '../src/types';

describe('buildPrompt', () => {
    it('builds a Big Five likert prompt', () => {
        const item: InventoryItem = {
            id: '1',
            text: 'Worry about things',
            type: 'likert_5',
            keyed: 'plus',
            category: 'N1',
        };
        const prompt = buildPrompt(item);
        expect(prompt).toContain('Worry about things');
        expect(prompt).toContain('1 (Strongly Disagree)');
        expect(prompt).toContain('5 (Strongly Agree)');
    });

    it('builds an MBTI prompt with left/right text', () => {
        const item: InventoryItem = {
            id: 'mbti_1',
            text: 'Social Interaction',
            type: 'likert_5',
            dimension: 'IE',
            leftText: 'Needs time alone',
            rightText: 'Bored by time alone',
        };
        const prompt = buildPrompt(item);
        expect(prompt).toContain('Needs time alone');
        expect(prompt).toContain('Bored by time alone');
        expect(prompt).toContain('1 to 5');
    });

    it('builds a DISC choice_binary prompt', () => {
        const item: DISCItem = {
            id: 'disc_1',
            text: 'Select the word...',
            type: 'choice_binary',
            words: [
                { text: 'Charismatic', quadrant: 'I' },
                { text: 'Assertive', quadrant: 'D' },
                { text: 'Patient', quadrant: 'S' },
                { text: 'Analytical', quadrant: 'C' },
            ],
        };
        const prompt = buildPrompt(item);
        expect(prompt).toContain('1. Charismatic');
        expect(prompt).toContain('4. Analytical');
        expect(prompt).toContain('MOST');
        expect(prompt).toContain('LEAST');
    });
});

describe('parseResponse', () => {
    const likertItem: InventoryItem = {
        id: '1',
        text: 'Test',
        type: 'likert_5',
    };

    it('parses a simple number response', () => {
        const result = parseResponse('4', likertItem);
        expect(result.score).toBe(4);
        expect(result.parsed).toBe(true);
    });

    it('parses number from verbose response (takes last match)', () => {
        const verbose = 'I would rate this as somewhere around moderate. After thinking about it, my answer is 2 because I tend to be calm.';
        const result = parseResponse(verbose, likertItem);
        expect(result.score).toBe(2);
        expect(result.parsed).toBe(true);
    });

    it('falls back to 3 when no valid number found', () => {
        const result = parseResponse('I cannot answer this question', likertItem);
        expect(result.score).toBe(3);
        expect(result.parsed).toBe(false);
    });

    it('falls back to 3 for JSON responses', () => {
        const result = parseResponse('{"error": "something"}', likertItem);
        expect(result.score).toBe(3);
        expect(result.parsed).toBe(false);
    });

    it('parses DISC most/least format', () => {
        const discItem: DISCItem = {
            id: 'disc_1',
            text: 'Select...',
            type: 'choice_binary',
            words: [
                { text: 'Charismatic', quadrant: 'I' },
                { text: 'Assertive', quadrant: 'D' },
                { text: 'Patient', quadrant: 'S' },
                { text: 'Analytical', quadrant: 'C' },
            ],
        };
        const result = parseResponse('2, 4', discItem);
        expect(result.score).toBe(13); // (2-1)*10 + (4-1) = 13
        expect(result.parsed).toBe(true);
    });

    it('uses fallback digit parsing', () => {
        const result = parseResponse('Rating:3.', likertItem);
        expect(result.score).toBe(3);
        expect(result.parsed).toBe(true);
    });
});

describe('collectItems', () => {
    it('collects Big Five items', () => {
        const items = collectItems(['bigfive']);
        expect(items.length).toBe(120);
    });

    it('collects MBTI items', () => {
        const items = collectItems(['mbti']);
        expect(items.length).toBe(32);
    });

    it('collects DISC items', () => {
        const items = collectItems(['disc']);
        expect(items.length).toBe(28);
    });

    it('collects Dark Triad items', () => {
        const items = collectItems(['darktriad']);
        expect(items.length).toBe(27);
    });

    it('collects multiple inventories', () => {
        const items = collectItems(['bigfive', 'mbti', 'disc', 'darktriad']);
        expect(items.length).toBe(120 + 32 + 28 + 27);
    });

    it('returns empty for unknown inventories', () => {
        const items = collectItems(['unknown']);
        expect(items.length).toBe(0);
    });
});

describe('validateInventories', () => {
    it('returns empty for valid inventories', () => {
        expect(validateInventories(['bigfive', 'mbti', 'disc', 'darktriad'])).toEqual([]);
    });

    it('returns invalid inventory names', () => {
        expect(validateInventories(['bigfive', 'unknown'])).toEqual(['unknown']);
    });
});

describe('runAssessment', () => {
    it('runs a minimal assessment with mock backend', async () => {
        let callCount = 0;
        const mockBackend: LLMBackend = {
            async query() {
                callCount++;
                return '3';
            },
        };

        const progressUpdates: [number, number][] = [];
        const logs: string[] = [];

        const profile = await runAssessment(mockBackend, {
            model: 'test-model',
            inventories: ['darktriad'], // smallest inventory (27 items)
            persona: 'Test',
            samplesPerItem: 1, // 1 sample to keep it fast
            chunkSize: 10,
            onProgress: (completed, total) => progressUpdates.push([completed, total]),
            onLog: (msg) => logs.push(msg),
        });

        expect(profile.modelName).toBe('test-model');
        expect(profile.persona).toBe('Test');
        expect(profile.results['darktriad']).toBeDefined();
        expect(profile.results['darktriad'].inventoryName).toBe('darktriad');
        expect(callCount).toBe(27); // 27 items x 1 sample
        expect(progressUpdates.length).toBeGreaterThan(0);
        expect(logs.length).toBeGreaterThan(0);
    });

    it('handles backend errors gracefully', async () => {
        let callNum = 0;
        const mockBackend: LLMBackend = {
            async query() {
                callNum++;
                if (callNum % 3 === 0) throw new Error('Network error');
                return '4';
            },
        };

        const profile = await runAssessment(mockBackend, {
            model: 'error-model',
            inventories: ['darktriad'],
            samplesPerItem: 1,
            chunkSize: 27,
        });

        // Should still complete with fallback scores
        expect(profile.results['darktriad']).toBeDefined();
        expect(profile.logs!.some(l => l.type === 'error')).toBe(true);
    });

    it('rejects invalid inventories', async () => {
        const mockBackend: LLMBackend = { async query() { return '3'; } };

        await expect(
            runAssessment(mockBackend, {
                model: 'test',
                inventories: ['invalid'],
            })
        ).rejects.toThrow('Invalid inventories');
    });

    it('calculates Big Five + derived MBTI', async () => {
        const mockBackend: LLMBackend = { async query() { return '4'; } };

        const profile = await runAssessment(mockBackend, {
            model: 'test',
            inventories: ['bigfive'],
            samplesPerItem: 1,
            chunkSize: 30,
        });

        expect(profile.results['bigfive']).toBeDefined();
        expect(profile.results['mbti_derived']).toBeDefined();
        expect(profile.results['mbti_derived'].type).toBeDefined();
        expect(profile.results['mbti_derived'].type!.length).toBe(4);
    });
});
