import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerEstatsTools(server: McpServer) {
    server.registerTool(
        'get_error_statistics',
        {
            title: 'Get Akamai Error Statistics',
            description:
                'Returns HTTP error statistics (status code distribution, error percentages) for a URL or CP code. Shows edge errors and/or origin errors over the last 24-48 hours.',
            inputSchema: {
                url: z
                    .string()
                    .optional()
                    .describe('Fully qualified URL to get error stats for. Provide either this or cpCode.'),
                cpCode: z
                    .number()
                    .optional()
                    .describe('CP code to get error stats for. Provide either this or url.'),
                delivery: z
                    .enum(['STANDARD_TLS', 'ENHANCED_TLS'])
                    .optional()
                    .describe('Type of delivery network. If omitted, auto-detected.'),
                errorType: z
                    .enum(['EDGE_ERRORS', 'ORIGIN_ERRORS'])
                    .optional()
                    .describe(
                        'Traffic direction. EDGE_ERRORS = edge→client, ORIGIN_ERRORS = edge→origin. If omitted, returns both.'
                    )
            }
        },
        async ({ url, cpCode, delivery, errorType }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.estats.postEstats(
                    {
                        url,
                        cpCode,
                        delivery: delivery as any,
                        errorType: errorType as any
                    },
                    query
                )

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`Error statistics request failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to get error statistics: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
