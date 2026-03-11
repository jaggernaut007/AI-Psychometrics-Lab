/**
 * MCP Tool: recommend_local_model
 * Recommends local AI models based on available hardware.
 * @author Shreyas Jagannath
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSystemSpecs } from '../utils/system-specs.js';
import { recommendModels } from '../utils/model-registry.js';

const RecommendModelInput = {
    task: z.string().optional().describe('Task description (e.g. "psychometric assessment", "general chat")'),
    min_quality: z.enum(['low', 'medium', 'high']).optional().describe('Minimum quality tier for recommendations'),
};

export function registerRecommendModel(server: McpServer): void {
    server.tool(
        'recommend_local_model',
        'Recommend local AI models that can run on the current hardware. Analyzes system specs and suggests compatible models with estimated performance.',
        RecommendModelInput,
        async (params) => {
            try {
                const specs = getSystemSpecs();
                const recommendations = recommendModels(specs, {
                    task: params.task,
                    minQuality: params.min_quality,
                });

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            systemSpecs: {
                                ram_gb: specs.ram_gb,
                                cpu_cores: specs.cpu_cores,
                                gpu: specs.gpu,
                            },
                            recommendations: recommendations.map(r => ({
                                model: r.model,
                                displayName: r.displayName,
                                parameterCount: r.parameterCount,
                                quality: r.quality,
                                estimatedTokensPerSec: r.estimatedTokensPerSec,
                                gpuAccelerated: r.gpuRequired,
                                notes: r.notes,
                                pullCommand: `ollama pull ${r.model}`,
                            })),
                            total: recommendations.length,
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: `Recommendation failed: ${error instanceof Error ? error.message : String(error)}` }),
                    }],
                    isError: true,
                };
            }
        }
    );
}
