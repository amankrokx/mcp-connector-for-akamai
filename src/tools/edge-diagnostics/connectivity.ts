import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, pollAsyncRequest, textContent } from '../utils.js'

export function registerConnectivityTools(server: McpServer) {
    server.registerTool(
        'connectivity_problems',
        {
            title: 'Connectivity Problems Scenario',
            description:
                'Runs Akamai connectivity diagnostics for a URL — simultaneously executes GREP (edge logs), cURL (content fetch), and MTR (traceroute). Useful for diagnosing slow downloads and high response times. This is an async operation.',
            inputSchema: {
                url: z.string().describe('The URL to diagnose connectivity problems for.'),
                edgeLocationId: z
                    .string()
                    .optional()
                    .describe('Edge server location ID nearest to the affected users.'),
                clientIp: z
                    .string()
                    .optional()
                    .describe('Client IP experiencing the issue (used as MTR source).'),
                ipVersion: z.enum(['IPV4', 'IPV6']).optional().describe('IP version to use.'),
                packetType: z.enum(['ICMP', 'TCP']).optional().describe('Packet type for MTR.'),
                port: z.number().optional().describe('Port for MTR (80 or 443).'),
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
            clientIp,
            ipVersion,
            packetType,
            port,
            requestHeaders,
            runFromSiteShield,
            spoofEdgeIp
        }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const initial = await client.connectivityProblems.postConnectivityProblems(
                    {
                        url,
                        edgeLocationId,
                        clientIp,
                        ipVersion: ipVersion as any,
                        packetType: packetType as any,
                        port: port as any,
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
                    return errorContent(`Connectivity problems scenario failed: ${formatJson(initial.data)}`)
                }

                const requestId = initial.data.requestId
                if (requestId === undefined) {
                    return errorContent('No requestId returned from connectivity problems')
                }

                const result = await pollAsyncRequest(
                    () => client.connectivityProblems.getConnectivityProblemsRequest(requestId, { ...query }),
                    (data) => data.executionStatus
                )

                if (result.executionStatus === 'FAILURE') {
                    return errorContent(`Connectivity problems scenario failed: ${formatJson(result)}`)
                }

                return textContent(formatJson(result))
            } catch (e) {
                return errorContent(
                    `Failed to run connectivity problems: ${e instanceof Error ? e.message : String(e)}`
                )
            }
        }
    )
}
