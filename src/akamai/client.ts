import { createEdgeDiagnosticsClient, type EdgeDiagnostics } from './apis/edge-diagnostics/index.js'
import type { AkamaiCredentials } from './customFetch.js'

export interface AkamaiConfig {
    credentials: AkamaiCredentials
    accountSwitchKey?: string
}

export interface AkamaiClients {
    edgeDiagnostics: EdgeDiagnostics<unknown>
    // Future APIs:
    // cachePurge: CachePurge<unknown>
    // propertyManager: PropertyManager<unknown>
}

let _clients: AkamaiClients | undefined
let _config: AkamaiConfig | undefined

export function initAkamaiClient(config: AkamaiConfig) {
    _config = config
    _clients = {
        edgeDiagnostics: createEdgeDiagnosticsClient(config.credentials)
    }
}

export function getClients(): AkamaiClients {
    if (!_clients) throw new Error('Akamai clients not initialized. Call initAkamaiClient() first.')
    return _clients
}

export function getAccountSwitchKey(): { accountSwitchKey?: string } | undefined {
    if (_config?.accountSwitchKey) {
        return { accountSwitchKey: _config.accountSwitchKey }
    }
    return undefined
}
