import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { getAccountSwitchKey, getClients } from '../../akamai/client.js'
import { errorContent, formatJson, textContent } from '../utils.js'

export function registerMtrTools(server: McpServer) {
    server.registerTool(
        'mtr_from_edge',
        {
            title: 'MTR from Akamai Edge',
            description:
                'Runs an MTR (My Traceroute) network diagnostic from an Akamai edge server to a destination IP or hostname. Shows network path, latency per hop, and packet loss. Useful for diagnosing connectivity issues.',
            inputSchema: {
                destination: z.string().describe('Destination IP or hostname for the MTR.'),
                destinationType: z
                    .enum(['IP', 'HOST'])
                    .describe('Whether the destination is an IP address or hostname.'),
                packetType: z
                    .enum(['ICMP', 'TCP'])
                    .describe('Packet type for MTR probes.'),
                port: z
                    .number()
                    .optional()
                    .describe('Port to use (80 or 443). Only needed when destinationType is HOST.'),
                source: z
                    .string()
                    .optional()
                    .describe('Source edge server IP or location ID.'),
                sourceType: z
                    .enum(['EDGE_IP', 'LOCATION'])
                    .optional()
                    .describe('Whether the source is an edge IP or a location ID.'),
                resolveDns: z.boolean().default(true).describe('Resolve DNS for each hop.'),
                showIps: z.boolean().default(true).describe('Show IPs for each hop.'),
                showLocations: z.boolean().default(true).describe('Show locations for each hop.'),
                siteShieldHostname: z
                    .string()
                    .optional()
                    .describe('Site Shield hostname to run MTR for.')
            }
        },
        async ({
            destination,
            destinationType,
            packetType,
            port,
            source,
            sourceType,
            resolveDns,
            showIps,
            showLocations,
            siteShieldHostname
        }) => {
            const client = getClients().edgeDiagnostics
            const query = getAccountSwitchKey()

            try {
                const response = await client.mtr.postMtr(
                    {
                        destination,
                        destinationType: destinationType as any,
                        packetType: packetType as any,
                        port: port as any,
                        source,
                        sourceType: sourceType as any,
                        resolveDns,
                        showIps,
                        showLocations,
                        siteShieldHostname
                    },
                    query
                )

                if (response.data.executionStatus === 'FAILURE') {
                    return errorContent(`MTR request failed: ${formatJson(response.data)}`)
                }

                return textContent(formatJson(response.data))
            } catch (e) {
                return errorContent(`Failed to run MTR: ${e instanceof Error ? e.message : String(e)}`)
            }
        }
    )
}
