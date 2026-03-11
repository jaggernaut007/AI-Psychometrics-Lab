/**
 * MCP Tool: get_results
 * Fetches stored assessment results by run ID, model name, or with a limit.
 * @author Shreyas Jagannath
 */
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createStorage } from '../storage/index.js';

const GetResultsInput = {
    runId: z.string().optional().describe('Specific run ID to fetch'),
    model: z.string().optional().describe('Filter by model name'),
    limit: z.number().optional().describe('Maximum number of results to return'),
};

export function registerGetResults(server: McpServer): void {
    server.tool(
        'get_results',
        'Fetch stored psychometric assessment results. Can filter by run ID, model name, or limit the number of results.',
        GetResultsInput,
        async (params) => {
            try {
                const storage = createStorage();

                // If a specific run ID is provided, fetch just that run
                if (params.runId) {
                    const run = await storage.getRun(params.runId);
                    if (!run) {
                        return {
                            content: [{
                                type: 'text' as const,
                                text: JSON.stringify({ error: `Run not found: ${params.runId}` }),
                            }],
                            isError: true,
                        };
                    }
                    return {
                        content: [{
                            type: 'text' as const,
                            text: JSON.stringify(run, null, 2),
                        }],
                    };
                }

                // Otherwise list runs with optional filters
                const runs = await storage.listRuns({
                    model: params.model,
                    limit: params.limit,
                });

                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({
                            count: runs.length,
                            runs: runs.map(r => ({
                                id: r.id,
                                model: r.profile.modelName,
                                persona: r.profile.persona,
                                inventories: Object.keys(r.profile.results),
                                createdAt: r.createdAt,
                            })),
                        }, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: `Failed to fetch results: ${error instanceof Error ? error.message : String(error)}` }),
                    }],
                    isError: true,
                };
            }
        }
    );
}
