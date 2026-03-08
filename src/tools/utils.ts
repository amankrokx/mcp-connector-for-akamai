const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Polls an async Akamai API endpoint until it completes.
 * Akamai async endpoints return a retryAfter (seconds) and link to poll.
 */
export async function pollAsyncRequest<T>(
    pollFn: () => Promise<{ data: T }>,
    getStatus: (data: T) => string,
    maxAttempts = 30,
    initialDelayMs = 2000
): Promise<T> {
    let delay = initialDelayMs
    for (let i = 0; i < maxAttempts; i++) {
        await sleep(delay)
        const response = await pollFn()
        const status = getStatus(response.data)
        if (status === 'SUCCESS' || status === 'FAILURE') {
            return response.data
        }
        // Exponential backoff capped at 10s
        delay = Math.min(delay * 1.5, 10000)
    }
    throw new Error('Async request timed out after maximum polling attempts')
}

/** Formats a JSON response into readable text for MCP tool output */
export function formatJson(data: unknown): string {
    return JSON.stringify(data, null, 2)
}

/** Creates a standard MCP text content response */
export function textContent(text: string) {
    return { content: [{ type: 'text' as const, text }] }
}

/** Creates an error text content response */
export function errorContent(message: string) {
    return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true }
}
