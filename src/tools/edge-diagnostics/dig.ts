import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerDigTools(server: McpServer) {
    server.registerTool(
        'dig_from_edge',
        {
            title: 'DNS Dig from Akamai Edge',
            description:
                'Runs a DNS dig command from an Akamai edge server, returning DNS records for a hostname. Useful for debugging DNS resolution and propagation issues.',
            inputSchema: {
                hostname: z.string().describe('The hostname or domain name to look up.'),
                queryType: z
                    .enum(['A', 'AAAA', 'SOA', 'CNAME', 'PTR', 'MX', 'NS', 'TXT', 'SRV', 'CAA', 'ANY'])
                    .describe('DNS record type to query.'),
                isGtmHostname: z
                    .boolean()
                    .default(false)
                    .describe('Set to true if the hostname is a GTM hostname.'),
                edgeIp: z
                    .string()
                    .optional()
                    .describe('Edge server IP to run dig from. Provide either this or edgeLocationId.'),
                edgeLocationId: z
                    .string()
                    .optional()
                    .describe('Edge server location ID. Provide either this or edgeIp.')
            }
        },
        async ({ hostname, queryType, isGtmHostname, edgeIp, edgeLocationId }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.dig.postDig(
                    {
                        hostname,
                        queryType: queryType as any,
                        isGtmHostname,
                        edgeIp,
                        edgeLocationId
                    },
                    query
                )

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`Dig request failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to run dig: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
