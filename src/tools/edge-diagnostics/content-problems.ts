import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, pollAsyncRequest, textContent } from '../utils.js'

export function registerContentProblemsTools(server: McpServer) {
    server.registerTool(
        'content_problems',
        {
            title: 'Content Problems Scenario',
            description:
                'Runs Akamai content problem diagnostics for a URL — fetches content via cURL from both edge and origin to compare responses. Useful for diagnosing cache inconsistencies, stale content, and origin errors. This is an async operation.',
            inputSchema: {
                url: z.string().describe('The URL to diagnose content problems for.'),
                edgeLocationId: z
                    .string()
                    .optional()
                    .describe('Edge server location ID nearest to the affected users.'),
                ipVersion: z.enum(['IPV4', 'IPV6']).optional().describe('IP version to use.'),
                requestHeaders: z
                    .array(z.string())
                    .optional()
                    .describe('Custom request headers in "header: value" format.'),
                runFromSiteShield: z.boolean().optional().describe('Run from a Site Shield map.'),
                spoofEdgeIp: z.string().optional().describe('Edge server IP to serve traffic from.')
            }
        },
        async ({ url, edgeLocationId, ipVersion, requestHeaders, runFromSiteShield, spoofEdgeIp }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const initial = await client.contentProblems.postContentProblems(
                    query,
                    {
                        url,
                        edgeLocationId,
                        ipVersion: ipVersion as any,
                        requestHeaders,
                        runFromSiteShield,
                        spoofEdgeIp
                    }
                )

                if (initial.data.executionStatus === 'SUCCESS') {
                    return textContent(formatJson(initial.data))
                }
                if (initial.data.executionStatus === 'FAILURE') {
                    return errorContent(`Content problems scenario failed: ${formatJson(initial.data)}`)
                }

                const requestId = initial.data.requestId
                if (requestId === undefined) {
                    return errorContent('No requestId returned from content problems')
                }

                const result = await pollAsyncRequest(
                    () => client.contentProblems.getContentProblems(requestId, { ...query }),
                    (data) => data.executionStatus
                )

                if (result.executionStatus === 'FAILURE') {
                    return errorContent(`Content problems scenario failed: ${formatJson(result)}`)
                }

                return textContent(formatJson(result))
            } catch (e) {
                return errorContent(
                    `Failed to run content problems: ${e instanceof Error ? e.message : String(e)}`
                )
            }
        }
    )
}
