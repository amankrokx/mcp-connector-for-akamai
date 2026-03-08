import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerCurlTools(server: McpServer) {
    server.registerTool(
        'curl_from_edge',
        {
            title: 'cURL from Akamai Edge',
            description:
                'Fetches a URL from an Akamai edge server, returning full HTTP response headers (including Akamai debug/Pragma headers) and body. Useful for debugging what the edge is serving, cache status, and response timing.',
            inputSchema: {
                url: z.string().describe('The URL to fetch from the edge server.'),
                edgeIp: z
                    .string()
                    .optional()
                    .describe(
                        'IP of the edge server to run from. Provide either this or edgeLocationId.'
                    ),
                edgeLocationId: z
                    .string()
                    .optional()
                    .describe(
                        'Edge server location ID (from list_edge_locations). Provide either this or edgeIp.'
                    ),
                ipVersion: z
                    .enum(['IPV4', 'IPV6'])
                    .optional()
                    .describe('IP version to use. Defaults to IPV4.'),
                requestHeaders: z
                    .array(z.string())
                    .optional()
                    .describe(
                        'Custom headers in "header: value" format. Akamai Pragma headers are included automatically.'
                    ),
                runFromSiteShield: z
                    .boolean()
                    .optional()
                    .describe('Run curl from a Site Shield map.'),
                spoofEdgeIp: z
                    .string()
                    .optional()
                    .describe('IP of the edge server you want to serve traffic from.')
            }
        },
        async ({ url, edgeIp, edgeLocationId, ipVersion, requestHeaders, runFromSiteShield, spoofEdgeIp }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.curl.postCurl(
                    {
                        url,
                        edgeIp,
                        edgeLocationId,
                        ipVersion: ipVersion as any,
                        requestHeaders,
                        runFromSiteShield,
                        spoofEdgeIp
                    },
                    query
                )

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`cURL request failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to run cURL: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
