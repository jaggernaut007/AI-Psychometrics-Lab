/**
 * MCP Tool: list_inventories
 * Returns metadata and trait definitions for all available psychometric inventories.
 * @author Shreyas Jagannath
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
    INVENTORY_METADATA,
    BIG_FIVE_DEFINITIONS,
    DISC_DEFINITIONS,
    DARK_TRIAD_DEFINITIONS,
    MBTI_DEFINITIONS,
} from '@apl/psychometrics-core';

export function registerListInventories(server: McpServer): void {
    server.tool(
        'list_inventories',
        'List all available psychometric inventories with their metadata and trait definitions.',
        {},
        async () => {
            const inventories = {
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

            return {
                content: [{
                    type: 'text' as const,
                    text: JSON.stringify(inventories, null, 2),
                }],
            };
        }
    );
}
