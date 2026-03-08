import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerLocateIpTools(server: McpServer) {
    server.registerTool(
        'verify_locate_ip',
        {
            title: 'Verify and Locate IP',
            description:
                'Verifies whether an IP address belongs to the Akamai edge network and returns its geolocation details (city, country, region, ASN, network).',
            inputSchema: {
                ipAddress: z.string().describe('The IP address to verify and locate.')
            }
        },
        async ({ ipAddress }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.verifyLocateIp.postVerifyLocateIp({ ipAddress }, query)

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`IP verification failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to verify/locate IP: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )

    server.registerTool(
        'locate_ip',
        {
            title: 'Locate IP Addresses',
            description:
                'Locates up to 10 IP addresses, returning geolocation data for each (city, country, region, ASN, network).',
            inputSchema: {
                ipAddresses: z
                    .array(z.string())
                    .min(1)
                    .max(10)
                    .describe('Up to 10 IP addresses to locate.')
            }
        },
        async ({ ipAddresses }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.locateIp.postLocateIp({ ipAddresses }, query)
                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to locate IPs: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
