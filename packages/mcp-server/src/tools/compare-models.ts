/**
 * MCP Tool: compare_models
 * Compares psychometric profiles of multiple AI models trait-by-trait.
 * @author Shreyas Jagannath
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { InventoryResult } from '@apl/psychometrics-core';
import { createStorage } from '../storage/index.js';

const CompareModelsInput = {
    models: z.array(z.string()).min(2).describe('List of model names to compare (at least 2)'),
    inventories: z.array(z.string()).optional().describe('Specific inventories to compare (default: all shared inventories)'),
};

interface TraitComparison {
    trait: string;
    scores: Record<string, number>;
    delta: number;
    highest: string;
    lowest: string;
}

interface InventoryComparison {
    inventory: string;
    traits: TraitComparison[];
    rankings: { model: string; averageScore: number }[];
}

export function registerCompareModels(server: McpServer): void {
    server.tool(
        'compare_models',
        'Compare psychometric profiles of multiple AI models. Computes trait-by-trait deltas and rankings.',
        CompareModelsInput,
        async (params) => {
            try {
                const storage = createStorage();

                // Fetch most recent run for each model
                const modelProfiles: Record<string, Record<string, InventoryResult>> = {};
                const missingModels: string[] = [];

                for (const model of params.models) {
                    const runs = await storage.listRuns({ model, limit: 1 });
                    if (runs.length === 0) {
                        missingModels.push(model);
                    } else {
                        modelProfiles[model] = runs[0].profile.results;
                    }
                }

                if (missingModels.length > 0) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify({
                                error: `No assessment results found for models: ${missingModels.join(', ')}. Run assessments first.`,
                            }),
                        }],
                        isError: true,
                    };
                }

                // Determine which inventories to compare
                const allModelInventories = Object.values(modelProfiles).map(r => new Set(Object.keys(r)));
                const sharedInventories = [...allModelInventories[0]].filter(inv =>
                    allModelInventories.every(s => s.has(inv))
                );

                const targetInventories = params.inventories
                    ? params.inventories.filter(inv => sharedInventories.includes(inv))
                    : sharedInventories;

                if (targetInventories.length === 0) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify({
                                error: 'No shared inventories found between the specified models.',
                                availablePerModel: Object.fromEntries(
                                    Object.entries(modelProfiles).map(([m, r]) => [m, Object.keys(r)])
                                ),
                            }),
                        }],
                        isError: true,
                    };
                }

                // Build comparisons
                const comparisons: InventoryComparison[] = [];

                for (const inv of targetInventories) {
                    const traits: TraitComparison[] = [];

                    // Get all trait keys from the first model
                    const firstModel = params.models[0];
                    const traitKeys = Object.keys(modelProfiles[firstModel][inv].traitScores);

                    for (const trait of traitKeys) {
                        const scores: Record<string, number> = {};
                        for (const model of params.models) {
                            scores[model] = modelProfiles[model][inv]?.traitScores[trait] ?? 0;
                        }

                        const values = Object.values(scores);
                        const maxVal = Math.max(...values);
                        const minVal = Math.min(...values);

                        const highest = Object.entries(scores).find(([, v]) => v === maxVal)?.[0] ?? '';
                        const lowest = Object.entries(scores).find(([, v]) => v === minVal)?.[0] ?? '';

                        traits.push({
                            trait,
                            scores,
                            delta: Math.round((maxVal - minVal) * 100) / 100,
                            highest,
                            lowest,
                        });
                    }

                    // Compute rankings by average trait score
                    const rankings = params.models.map(model => {
                        const traitScores = modelProfiles[model][inv]?.traitScores ?? {};
                        const values = Object.values(traitScores);
                        const avg = values.length > 0
                            ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
                            : 0;
                        return { model, averageScore: avg };
                    }).sort((a, b) => b.averageScore - a.averageScore);

                    comparisons.push({ inventory: inv, traits, rankings });
                }

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            modelsCompared: params.models,
                            inventoriesCompared: targetInventories,
                            comparisons,
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: `Comparison failed: ${error instanceof Error ? error.message : String(error)}` }),
                    }],
                    isError: true,
                };
            }
        }
    );
}
