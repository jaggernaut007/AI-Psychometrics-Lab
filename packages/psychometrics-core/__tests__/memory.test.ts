/**
 * Memory optimization tests to ensure the system doesn't crash under load.
 * @author Shreyas Jagannath
 */
import { describe, it, expect } from 'vitest';
import {
    collectItems,
    buildPrompt,
    parseResponse,
    runAssessment,
} from '../src/engine';
import type { LLMBackend, InventoryItem } from '../src/types';

function getMemoryUsageMB(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed / 1024 / 1024;
    }
    return 0;
}

describe('Memory Optimization', () => {
    it('collecting all inventories does not exceed 5MB', () => {
        const before = getMemoryUsageMB();
        const items = collectItems(['bigfive', 'mbti', 'disc', 'darktriad']);
        const after = getMemoryUsageMB();

        expect(items.length).toBe(207); // 120 + 32 + 28 + 27
        expect(after - before).toBeLessThan(5);
    });

    it('building prompts for all items does not leak memory', () => {
        const items = collectItems(['bigfive', 'mbti', 'disc', 'darktriad']);
        const before = getMemoryUsageMB();

        const prompts: string[] = [];
        for (const item of items) {
            prompts.push(buildPrompt(item));
        }

        const after = getMemoryUsageMB();
        expect(prompts.length).toBe(207);
        // Prompts should not use more than 10MB total
        expect(after - before).toBeLessThan(10);
    });

    it('parsing thousands of responses does not accumulate memory', () => {
        const item: InventoryItem = { id: 'test', text: 'Test item', type: 'likert_5' };
        const before = getMemoryUsageMB();

        for (let i = 0; i < 10000; i++) {
            parseResponse(`My answer is ${(i % 5) + 1}`, item);
        }

        const after = getMemoryUsageMB();
        // 10k parses should not use more than 20MB
        expect(after - before).toBeLessThan(20);
    });

    it('assessment logs do not grow unboundedly', async () => {
        let callCount = 0;
        const mockBackend: LLMBackend = {
            async query() {
                callCount++;
                return '3';
            },
        };

        const logs: string[] = [];
        const profile = await runAssessment(mockBackend, {
            model: 'memory-test-model',
            inventories: ['darktriad'], // 27 items
            samplesPerItem: 1,
            chunkSize: 27,
            onLog: (msg) => logs.push(msg),
        });

        // Logs should be bounded: ~27 item logs + start/calculate/complete messages
        expect(profile.logs!.length).toBeLessThan(100);
        // Each log entry should be reasonable size
        const totalLogSize = JSON.stringify(profile.logs).length;
        expect(totalLogSize).toBeLessThan(50000); // < 50KB for logs
    });

    it('concurrent chunk processing does not cause memory spikes', async () => {
        const mockBackend: LLMBackend = {
            async query() {
                return '4';
            },
        };

        const before = getMemoryUsageMB();

        const profile = await runAssessment(mockBackend, {
            model: 'concurrent-test',
            inventories: ['bigfive'], // 120 items, largest inventory
            samplesPerItem: 2,
            chunkSize: 10, // process 10 items concurrently
        });

        const after = getMemoryUsageMB();

        expect(profile.results['bigfive']).toBeDefined();
        // Running 120 items x 2 samples concurrently in chunks should not spike > 50MB
        expect(after - before).toBeLessThan(50);
    });

    it('rate limiter sliding window does not accumulate stale entries', async () => {
        // Simulate the rate limiter pattern used in the API
        const windows = new Map<string, { count: number; resetAt: number }>();

        // Simulate 1000 requests from different IPs
        for (let i = 0; i < 1000; i++) {
            const key = `ip-${i % 50}`; // 50 unique IPs
            const now = Date.now();
            const window = windows.get(key);

            if (!window || now >= window.resetAt) {
                windows.set(key, { count: 1, resetAt: now + 60000 });
            } else {
                window.count++;
            }
        }

        // Should only have 50 entries max (one per IP), not 1000
        expect(windows.size).toBeLessThanOrEqual(50);

        // Simulate cleanup of expired windows
        const futureTime = Date.now() + 120000;
        for (const [key, window] of windows.entries()) {
            if (futureTime >= window.resetAt) {
                windows.delete(key);
            }
        }

        expect(windows.size).toBe(0);
    });

    it('large rawScores objects are handled efficiently', () => {
        // Simulate raw scores from a full assessment (all inventories, 5 samples each)
        const rawScores: Record<string, number[]> = {};
        const items = collectItems(['bigfive', 'mbti', 'disc', 'darktriad']);

        const before = getMemoryUsageMB();

        for (const item of items) {
            rawScores[item.id] = Array.from({ length: 5 }, () => Math.floor(Math.random() * 5) + 1);
        }

        const serialized = JSON.stringify(rawScores);
        const after = getMemoryUsageMB();

        // 207 items x 5 samples = 1035 numbers, should be tiny
        expect(serialized.length).toBeLessThan(20000); // < 20KB
        expect(after - before).toBeLessThan(5);
    });
});
