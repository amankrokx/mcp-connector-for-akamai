import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, pollAsyncRequest, textContent } from '../utils.js'

export function registerErrorTranslatorTools(server: McpServer) {
    server.registerTool(
        'translate_error_string',
        {
            title: 'Translate Akamai Error String',
            description:
                'Translates an Akamai error reference code (e.g. "9.6f64d440.1318965461.2f2b078") into human-readable error details including logs, HTTP status codes, and request/response metadata. This is an async operation that polls until complete.',
            inputSchema: {
                errorCode: z
                    .string()
                    .describe(
                        'The alphanumeric error reference code from Akamai error pages (e.g. "9.6f64d440.1318965461.2f2b078"). This is the "Reference #" shown on Akamai error pages.'
                    ),
                traceForwardLogs: z
                    .boolean()
                    .optional()
                    .describe(
                        'When true, gets logs from all edge servers involved in serving the request (not just the one where the error occurred). May take longer. Defaults to false.'
                    )
            }
        },
        async ({ errorCode, traceForwardLogs }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const initial = await client.errorTranslator.postErrorTranslator(
                    { errorCode, traceForwardLogs },
                    query
                )

                // If already completed
                if (initial.data.executionStatus === 'SUCCESS') {
                    return textContent(formatJson(initial.data))
                }
                if (initial.data.executionStatus === 'FAILURE') {
                    return errorContent(`Error translation failed: ${formatJson(initial.data)}`)
                }

                // Poll for result
                const requestId = initial.data.requestId
                if (requestId === undefined) {
                    return errorContent('No requestId returned from error translator')
                }

                const result = await pollAsyncRequest(
                    () => client.errorTranslator.getErrorTranslatorRequest(requestId, query),
                    (data) => data.executionStatus
                )

                if (result.executionStatus === 'FAILURE') {
                    return errorContent(`Error translation failed: ${formatJson(result)}`)
                }

                return textContent(formatJson(result))
            } catch (e) {
                return errorContent(`Failed to translate error: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
