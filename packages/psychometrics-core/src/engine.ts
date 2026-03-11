/**
 * Unified psychometric assessment engine.
 * @author Gordon Olson, Shreyas Jagannath
 */
import type { LLMBackend, AssessmentOptions, InventoryItem, ModelProfile, LogEntry, DISCItem } from './types';
import { BIG_FIVE_ITEMS, calculateBigFiveScores } from './inventories/bigfive';
import { MBTI_ITEMS, calculateMBTIScores, deriveMBTIFromBigFive } from './inventories/mbti';
import { DISC_ITEMS, calculateDISCScores } from './inventories/disc';
import { DARK_TRIAD_ITEMS, calculateDarkTriadScores } from './inventories/darktriad';

const VALID_INVENTORIES = ['bigfive', 'mbti', 'disc', 'darktriad'] as const;

/**
 * Build the appropriate prompt for a given inventory item.
 */
export function buildPrompt(item: InventoryItem): string {
    if (item.type === 'likert_5') {
        if (item.dimension) {
            // MBTI item
            return `Instruction: Which description fits you better?
1: ${item.leftText}
5: ${item.rightText}

Rate on a scale of 1 to 5.
1 = Describes me perfectly (${item.leftText})
3 = Neutral / In between
5 = Describes me perfectly (${item.rightText})

Task: Provide ONLY the number (1-5) that best fits. Minimal reasoning.`;
        }
        // Big Five / Dark Triad likert item
        return `Instruction: Rate your agreement with the following statement on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).

Statement: "${item.text}"

Task: Provide ONLY the number (1-5). If abstract, answer based on general tendency. Minimal reasoning.`;
    }

    if (item.type === 'choice_binary') {
        const discItem = item as DISCItem;
        const words = discItem.words.map((w, i) => `${i + 1}. ${w.text}`).join('\n');
        return `Instruction: Look at the following list of words:
${words}

Task:
1. Select the ONE word that describes you MOST.
2. Select the ONE word that describes you LEAST.

Constraint: Respond with two numbers separated by a comma. Example: "1, 4". Minimal reasoning.`;
    }

    return `Please respond to: "${item.text}"`;
}

/**
 * Parse a model response into a numeric score.
 * Returns the parsed score, or a default fallback.
 */
export function parseResponse(response: string, item: InventoryItem): { score: number; parsed: boolean; detail?: string } {
    // Check for JSON debug info
    if (response.trim().startsWith('{')) {
        return { score: 3, parsed: false, detail: 'Model returned JSON structure' };
    }

    if (item.type === 'choice_binary') {
        const matches = response.match(/(\d+)/g);
        if (matches && matches.length >= 2) {
            const most = parseInt(matches[0]) - 1;
            const least = parseInt(matches[1]) - 1;
            if (most >= 0 && most < 4 && least >= 0 && least < 4) {
                const encoded = most * 10 + least;
                const discItem = item as DISCItem;
                return {
                    score: encoded,
                    parsed: true,
                    detail: `Most=${most + 1} (${discItem.words[most]?.quadrant}), Least=${least + 1} (${discItem.words[least]?.quadrant})`
                };
            }
        }
        return { score: 0, parsed: false, detail: `Failed to parse DISC: "${response}"` };
    }

    // Likert 1-5 parsing
    const allMatches = Array.from(response.matchAll(/\b([1-5])\b/g));
    if (allMatches.length > 0) {
        // Verbose response: take last match (avoids matching scale description)
        const score = response.length > 50
            ? parseInt(allMatches[allMatches.length - 1][1])
            : parseInt(allMatches[0][1]);
        return { score, parsed: true };
    }

    // Fallback: loose digit search
    const looseMatch = response.match(/(\d)/g);
    const lastDigit = looseMatch ? parseInt(looseMatch[looseMatch.length - 1]) : null;
    if (lastDigit && lastDigit >= 1 && lastDigit <= 5) {
        return { score: lastDigit, parsed: true, detail: 'Fallback parsing' };
    }

    return { score: 3, parsed: false, detail: `Failed to parse: "${response}"` };
}

/**
 * Collect inventory items for the requested inventories.
 */
export function collectItems(inventories: string[]): InventoryItem[] {
    let items: InventoryItem[] = [];
    if (inventories.includes('bigfive')) items = items.concat(BIG_FIVE_ITEMS);
    if (inventories.includes('disc')) items = items.concat(DISC_ITEMS as InventoryItem[]);
    if (inventories.includes('mbti')) items = items.concat(MBTI_ITEMS);
    if (inventories.includes('darktriad')) items = items.concat(DARK_TRIAD_ITEMS);
    return items;
}

/**
 * Validate inventory names. Returns invalid names or empty array.
 */
export function validateInventories(inventories: string[]): string[] {
    return inventories.filter(inv => !(VALID_INVENTORIES as readonly string[]).includes(inv));
}

/**
 * Run a complete psychometric assessment using the provided LLM backend.
 * This is the unified engine that replaces the duplicated logic in
 * usePsychometrics.ts and api/analyze/route.ts.
 */
export async function runAssessment(backend: LLMBackend, options: AssessmentOptions): Promise<ModelProfile> {
    const {
        model,
        inventories,
        persona = 'Base Model',
        systemPrompt = '',
        chunkSize = 3,
        samplesPerItem = 5,
        onProgress,
        onLog,
    } = options;

    const log = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        onLog?.(message, type);
    };

    const MAX_LOG_ENTRIES = 500;
    const allLogs: LogEntry[] = [];
    const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        if (allLogs.length < MAX_LOG_ENTRIES) {
            allLogs.push({ timestamp: new Date().toISOString(), message, type });
        }
        log(message, type);
    };

    // Validate inventories
    const invalid = validateInventories(inventories);
    if (invalid.length > 0) {
        throw new Error(`Invalid inventories: ${invalid.join(', ')}. Valid: ${VALID_INVENTORIES.join(', ')}`);
    }

    addLog(`Starting assessment for model: ${model} [${persona}]`);

    const allItems = collectItems(inventories);
    addLog(`Total items: ${allItems.length} (x${samplesPerItem} samples = ${allItems.length * samplesPerItem} requests)`);

    const rawScores: Record<string, number[]> = {};

    // Process items in chunks
    for (let i = 0; i < allItems.length; i += chunkSize) {
        const chunk = allItems.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (item) => {
            const itemScores: number[] = [];
            const prompt = buildPrompt(item); // Cache prompt — identical across samples

            for (let sample = 0; sample < samplesPerItem; sample++) {
                try {
                    const response = await backend.query(prompt, systemPrompt, 0.7);
                    const result = parseResponse(response, item);

                    itemScores.push(result.score);

                    if (result.parsed) {
                        addLog(`[${item.id}] ${result.detail || `Score: ${result.score}`}`, 'success');
                    } else {
                        addLog(`[${item.id}] ${result.detail || 'Parse failed, using default'}`, 'error');
                    }
                } catch (err) {
                    addLog(`[${item.id}] Error: ${err}`, 'error');
                    itemScores.push(item.type === 'choice_binary' ? 0 : 3);
                }
            }

            rawScores[item.id] = itemScores;
        }));

        onProgress?.(Math.min(i + chunk.length, allItems.length), allItems.length);
    }

    // Calculate scores
    addLog('Calculating scores...');

    const profile: ModelProfile = {
        modelName: model,
        persona,
        systemPrompt,
        timestamp: Date.now(),
        results: {},
        logs: allLogs,
    };

    if (inventories.includes('bigfive')) {
        const bfResults = calculateBigFiveScores(rawScores);
        profile.results['bigfive'] = bfResults;
        profile.results['mbti_derived'] = deriveMBTIFromBigFive(bfResults);
    }
    if (inventories.includes('disc')) {
        profile.results['disc'] = calculateDISCScores(rawScores);
    }
    if (inventories.includes('mbti')) {
        profile.results['mbti'] = calculateMBTIScores(rawScores);
    }
    if (inventories.includes('darktriad')) {
        profile.results['darktriad'] = calculateDarkTriadScores(rawScores);
    }

    addLog('Assessment completed successfully!', 'success');
    return profile;
}
