import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, pollAsyncRequest, textContent } from '../utils.js'

export function registerGrepTools(server: McpServer) {
    server.registerTool(
        'grep_edge_logs',
        {
            title: 'Grep Akamai Edge Logs',
            description:
                'Searches edge server logs by edge IP, time range, and filters (CP codes, hostnames, status codes, client IPs, user agents). This is an async operation that polls until logs are available.',
            inputSchema: {
                edgeIp: z.string().describe('Edge server IP to get logs from.'),
                start: z
                    .string()
                    .describe(
                        'ISO 8601 start time for the log search window (e.g. "2024-01-15T10:00:00Z"). Logs available for past 6-12 hours.'
                    ),
                end: z
                    .string()
                    .describe('ISO 8601 end time for the log search window.'),
                logType: z
                    .enum(['R', 'F', 'BOTH'])
                    .describe(
                        'Log type: R = client requests to edge, F = forward requests to origin, BOTH = both.'
                    ),
                cpCodes: z
                    .array(z.number())
                    .optional()
                    .describe('CP codes to filter by. Provide either this or hostnames.'),
                hostnames: z
                    .array(z.string())
                    .optional()
                    .describe('Hostnames to filter by. Provide either this or cpCodes.'),
                httpStatusCodes: z
                    .object({
                        comparison: z.enum(['EQUALS', 'BETWEEN', 'GREATER_THAN', 'LESS_THAN']).optional(),
                        value: z.array(z.number()).optional()
                    })
                    .optional()
                    .describe('Filter by HTTP status codes.'),
                clientIps: z.array(z.string()).optional().describe('Filter by client IPs.'),
                userAgents: z.array(z.string()).optional().describe('Filter by user agents.')
            }
        },
        async ({ edgeIp, start, end, logType, cpCodes, hostnames, httpStatusCodes, clientIps, userAgents }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const initial = await client.grep.postGrep(
                    {
                        edgeIp,
                        start,
                        end,
                        logType: logType as any,
                        cpCodes,
                        hostnames,
                        httpStatusCodes: httpStatusCodes as any,
                        clientIps,
                        userAgents
                    },
                    query
                )

                if (initial.data.executionStatus === 'SUCCESS') {
                    return textContent(formatJson(initial.data))
                }
                if (initial.data.executionStatus === 'FAILURE') {
                    return errorContent(`GREP request failed: ${formatJson(initial.data)}`)
                }

                const requestId = initial.data.requestId
                if (requestId === undefined) {
                    return errorContent('No requestId returned from GREP')
                }

                const result = await pollAsyncRequest(
                    () => client.grep.getGrepRequest(requestId, query),
                    (data) => data.executionStatus
                )

                if (result.executionStatus === 'FAILURE') {
                    return errorContent(`GREP request failed: ${formatJson(result)}`)
                }

                return textContent(formatJson(result))
            } catch (e) {
                return errorContent(`Failed to grep logs: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
