import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerConnectivityTools } from './edge-diagnostics/connectivity.js'
import { registerContentProblemsTools } from './edge-diagnostics/content-problems.js'
import { registerCurlTools } from './edge-diagnostics/curl.js'
import { registerDigTools } from './edge-diagnostics/dig.js'
import { registerEdgeLocationsTools } from './edge-diagnostics/edge-locations.js'
import { registerErrorTranslatorTools } from './edge-diagnostics/error-translator.js'
import { registerEstatsTools } from './edge-diagnostics/estats.js'
import { registerGrepTools } from './edge-diagnostics/grep.js'
import { registerLocateIpTools } from './edge-diagnostics/locate-ip.js'
import { registerMtrTools } from './edge-diagnostics/mtr.js'
import { registerTranslatedUrlTools } from './edge-diagnostics/translated-url.js'
import { registerUrlHealthCheckTools } from './edge-diagnostics/url-health-check.js'
import { registerVerifyEdgeIpTools } from './edge-diagnostics/verify-edge-ip.js'

export function registerAllTools(server: McpServer) {
    // Tier 1 — Core debugging
    registerErrorTranslatorTools(server)
    registerCurlTools(server)
    registerEstatsTools(server)
    registerLocateIpTools(server)

    // Tier 2 — Network diagnostics
    registerDigTools(server)
    registerMtrTools(server)
    registerGrepTools(server)
    registerEdgeLocationsTools(server)

    // Tier 3 — Advanced scenarios
    registerTranslatedUrlTools(server)
    registerVerifyEdgeIpTools(server)
    registerUrlHealthCheckTools(server)
    registerConnectivityTools(server)
    registerContentProblemsTools(server)
}
