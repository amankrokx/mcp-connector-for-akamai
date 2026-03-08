import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, pollAsyncRequest, textContent } from '../utils.js'

export function registerUrlHealthCheckTools(server: McpServer) {
    server.registerTool(
        'url_health_check',
        {
            title: 'URL Health Check',
            description:
                'Runs a comprehensive health check on a URL from the Akamai edge, combining cURL, dig, and optionally MTR. This is an async operation that polls until complete.',
            inputSchema: {
                url: z.string().describe('The URL to run the health check for.'),
                edgeLocationId: z
                    .string()
                    .optional()
                    .describe('Edge server location ID to run from.'),
                ipVersion: z
                    .enum(['IPV4', 'IPV6'])
                    .optional()
                    .describe('IP version to use.'),
                viewsAllowed: z
                    .array(z.enum(['CONNECTIVITY', 'CURL', 'DIG', 'LOGS', 'MTR']))
                    .optional()
                    .describe(
                        'Additional operations to run. CONNECTIVITY = MTR test, CURL = content fetch, DIG = DNS lookup, LOGS = edge logs, MTR = traceroute.'
                    ),
                packetType: z
                    .enum(['ICMP', 'TCP'])
                    .optional()
                    .describe('Packet type for MTR (if CONNECTIVITY is in viewsAllowed).'),
                port: z
                    .number()
                    .optional()
                    .describe('Port for MTR (80 or 443).'),
                queryType: z
                    .enum(['A', 'SOA', 'CNAME', 'PTR', 'MX', 'AAAA', 'NS', 'TXT', 'SRV', 'CAA', 'ANY'])
                    .optional()
                    .describe('DNS query type for the DIG command.'),
                requestHeaders: z
                    .array(z.string())
                    .optional()
                    .describe('Custom request headers in "header: value" format.'),
                runFromSiteShield: z.boolean().optional().describe('Run from a Site Shield map.'),
                spoofEdgeIp: z.string().optional().describe('Edge server IP to serve traffic from.')
            }
        },
        async ({
            url,
            edgeLocationId,
            ipVersion,
            viewsAllowed,
            packetType,
            port,
            queryType,
            requestHeaders,
            runFromSiteShield,
            spoofEdgeIp
        }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const initial = await client.urlHealthCheck.postUrlHealthCheck(
                    {
                        url,
                        edgeLocationId,
                        ipVersion: ipVersion as any,
                        viewsAllowed: viewsAllowed as any,
                        packetType: packetType as any,
                        port: port as any,
                        queryType: queryType as any,
                        requestHeaders,
                        runFromSiteShield,
                        spoofEdgeIp
                    },
                    query
                )

                if (initial.data.executionStatus === 'SUCCESS') {
                    return textContent(formatJson(initial.data))
                }
                if (initial.data.executionStatus === 'FAILURE') {
                    return errorContent(`URL health check failed: ${formatJson(initial.data)}`)
                }

                const requestId = initial.data.requestId
                if (requestId === undefined) {
                    return errorContent('No requestId returned from URL health check')
                }

                const result = await pollAsyncRequest(
                    () => client.urlHealthCheck.getUrlHealthCheckRequests(requestId, { ...query }),
                    (data) => data.executionStatus
                )

                if (result.executionStatus === 'FAILURE') {
                    return errorContent(`URL health check failed: ${formatJson(result)}`)
                }

                return textContent(formatJson(result))
            } catch (e) {
                return errorContent(`Failed to run URL health check: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
