import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerTranslatedUrlTools(server: McpServer) {
    server.registerTool(
        'translate_akamaized_url',
        {
            title: 'Translate Akamaized URL',
            description:
                'Translates an Akamaized URL (ARL) into its component parts: CP code, serial number, TTL, origin server, and other cache key metadata.',
            inputSchema: {
                url: z
                    .string()
                    .describe('The fully qualified Akamaized URL (ARL) to translate.')
            }
        },
        async ({ url }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.translatedUrl.postTranslatedUrl({ url }, query)
                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to translate URL: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
