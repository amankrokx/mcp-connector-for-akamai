#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { initAkamaiClient } from './akamai/client.js'
import { registerAllTools } from './tools/index.js'

const server = new McpServer({
    name: 'mcp-connector-for-akamai',
    version: '0.1.0'
})

function getRequiredEnv(name: string): string {
    const value = process.env[name]
    if (!value) {
        console.error(`Missing required environment variable: ${name}`)
        process.exit(1)
    }
    return value
}

initAkamaiClient({
    credentials: {
        client_secret: getRequiredEnv('AKAMAI_CLIENT_SECRET'),
        client_token: getRequiredEnv('AKAMAI_CLIENT_TOKEN'),
        access_token: getRequiredEnv('AKAMAI_ACCESS_TOKEN'),
        host: getRequiredEnv('AKAMAI_HOST')
    },
    accountSwitchKey: process.env.AKAMAI_ACCOUNT_SWITCH_KEY
})

registerAllTools(server)

async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('mcp-connector-for-akamai server running on stdio')
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
