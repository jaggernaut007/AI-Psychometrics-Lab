#!/usr/bin/env node
/**
 * AI Psychometrics Lab - MCP Server
 * Exposes psychometric assessment tools via the Model Context Protocol.
 *
 * Claude Desktop configuration example:
 * {
 *   "mcpServers": {
 *     "ai-psychometrics": {
 *       "command": "node",
 *       "args": ["/path/to/packages/mcp-server/dist/index.js"],
 *       "env": {
 *         "OPENROUTER_API_KEY": "sk-or-..."
 *       }
 *     }
 *   }
 * }
 *
 * @author Shreyas Jagannath
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerRunAssessment } from './tools/run-assessment.js';
import { registerGetResults } from './tools/get-results.js';
import { registerListInventories } from './tools/list-inventories.js';
import { registerCompareModels } from './tools/compare-models.js';
import { registerGetSystemSpecs } from './tools/get-system-specs.js';
import { registerRecommendModel } from './tools/recommend-model.js';

async function main(): Promise<void> {
    const server = new McpServer({
        name: 'ai-psychometrics-lab',
        version: '1.0.0',
    });

    // Register all tools
    registerRunAssessment(server);
    registerGetResults(server);
    registerListInventories(server);
    registerCompareModels(server);
    registerGetSystemSpecs(server);
    registerRecommendModel(server);

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('MCP Server failed to start:', error);
    process.exit(1);
});
