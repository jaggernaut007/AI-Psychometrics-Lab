/**
 * MCP Tool: run_assessment
 * Runs a psychometric assessment on an AI model using the specified backend.
 * @author Shreyas Jagannath
 */
import { z } from 'zod';
import {
    runAssessment,
    createOpenRouterBackend,
    OllamaBackend,
    validateInventories,
} from '@apl/psychometrics-core';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStorage } from '../storage/index.js';

const RunAssessmentInput = {
    model: z.string().describe('Model identifier (e.g. "meta-llama/llama-3.1-8b-instruct" for OpenRouter, or "llama3.1:8b" for Ollama)'),
    inventories: z.array(z.string()).describe('List of inventories to run: bigfive, mbti, disc, darktriad'),
    backend: z.enum(['openrouter', 'ollama']).default('openrouter').describe('LLM backend to use'),
    persona: z.string().optional().describe('Persona label for this assessment run'),
    systemPrompt: z.string().optional().describe('System prompt to prepend to all queries'),
    apiKey: z.string().optional().describe('OpenRouter API key (required for openrouter backend, or set OPENROUTER_API_KEY env var)'),
    ollamaBaseUrl: z.string().optional().describe('Ollama base URL (default: http://localhost:11434)'),
};

export function registerRunAssessment(server: McpServer): void {
    server.tool(
        'run_assessment',
        'Run a psychometric assessment on an AI model. Supports Big Five, MBTI, DISC, and Dark Triad inventories.',
        RunAssessmentInput,
        async (params) => {
            try {
                // Validate inventories
                const invalid = validateInventories(params.inventories);
                if (invalid.length > 0) {
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify({ error: `Invalid inventories: ${invalid.join(', ')}. Valid: bigfive, mbti, disc, darktriad` }),
                        }],
                        isError: true,
                    };
                }

                // Create the appropriate backend
                let backend;
                if (params.backend === 'ollama') {
                    const ollamaBackend = new OllamaBackend({
                        model: params.model,
                        baseUrl: params.ollamaBaseUrl,
                    });

                    // Health check
                    const health = await ollamaBackend.healthCheck();
                    if (!health.ok) {
                        return {
                            content: [{
                                type: 'text' as const,
                                text: JSON.stringify({ error: `Ollama health check failed: ${health.error}` }),
                            }],
                            isError: true,
                        };
                    }

                    backend = ollamaBackend;
                } else {
                    const apiKey = params.apiKey ?? process.env.OPENROUTER_API_KEY;
                    if (!apiKey) {
                        return {
                            content: [{
                                type: 'text' as const,
                                text: JSON.stringify({ error: 'OpenRouter API key is required. Provide it via apiKey parameter or OPENROUTER_API_KEY environment variable.' }),
                            }],
                            isError: true,
                        };
                    }
                    backend = createOpenRouterBackend({ apiKey, model: params.model });
                }

                // Run assessment
                const profile = await runAssessment(backend, {
                    model: params.model,
                    inventories: params.inventories,
                    persona: params.persona,
                    systemPrompt: params.systemPrompt,
                });

                // Save to storage
                const storage = createStorage();
                const stored = await storage.saveRun(profile);

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            runId: stored.id,
                            createdAt: stored.createdAt,
                            profile: stored.profile,
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: `Assessment failed: ${error instanceof Error ? error.message : String(error)}` }),
                    }],
                    isError: true,
                };
            }
        }
    );
}
