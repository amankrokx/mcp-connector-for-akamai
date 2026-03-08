import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerVerifyEdgeIpTools(server: McpServer) {
    server.registerTool(
        'verify_edge_ip',
        {
            title: 'Verify Akamai Edge IPs',
            description:
                'Verifies whether up to 10 IP addresses belong to the Akamai edge network.',
            inputSchema: {
                ipAddresses: z
                    .array(z.string())
                    .min(1)
                    .max(10)
                    .describe('Up to 10 IP addresses to verify.')
            }
        },
        async ({ ipAddresses }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.verifyEdgeIp.postVerifyEdgeIp({ ipAddresses }, query)

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`Edge IP verification failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to verify edge IPs: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
