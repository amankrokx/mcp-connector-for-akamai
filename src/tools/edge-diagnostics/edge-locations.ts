import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerEdgeLocationsTools(server: McpServer) {
    server.registerTool(
        'list_edge_locations',
        {
            title: 'List Akamai Edge Locations',
            description:
                'Lists available Akamai edge server locations. Returns location IDs that can be used as edgeLocationId in other tools (curl, dig, MTR, etc.).',
            inputSchema: {}
        },
        async () => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.edgeLocations.getEdgeLocations(query)
                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to list edge locations: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
