/**
 * MCP Tool: get_system_specs
 * Returns hardware specifications of the host machine.
 * @author Shreyas Jagannath
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getSystemSpecs } from '../utils/system-specs.js';

export function registerGetSystemSpecs(server: McpServer): void {
    server.tool(
        'get_system_specs',
        'Get hardware specifications of the host machine including RAM, CPU, GPU, and OS details.',
        {},
        async () => {
            try {
                const specs = getSystemSpecs();
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify(specs, null, 2),
                    }],
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text' as const,
                        text: JSON.stringify({ error: `Failed to detect system specs: ${error instanceof Error ? error.message : String(error)}` }),
                    }],
                    isError: true,
                };
            }
        }
    );
}
