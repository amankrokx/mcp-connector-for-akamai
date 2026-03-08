import { createCustomFetch, type AkamaiCredentials } from '../../customFetch.js'
import { EdgeDiagnostics } from './v1/index.js'

export function createEdgeDiagnosticsClient(credentials: AkamaiCredentials) {
    return new EdgeDiagnostics({
        baseUrl: `https://${credentials.host}/edge-diagnostics/v1`,
        customFetch: createCustomFetch(credentials)
    })
}

export { EdgeDiagnostics }
