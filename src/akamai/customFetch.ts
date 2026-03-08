import { generateEdgeGridAuth } from './generateAkamaiToken.js'

export interface AkamaiCredentials {
    client_secret: string
    client_token: string
    access_token: string
    host: string
}

export const createCustomFetch = (credentials: AkamaiCredentials) => {
    return async (input: string | URL | globalThis.Request, init: RequestInit = {}) => {
        let url: string
        if (typeof input === 'string') {
            url = input
        } else if (input instanceof URL) {
            url = input.toString()
        } else {
            url = input.url
        }

        const method = init.method ?? 'GET'

        let body: string
        if (typeof init.body === 'string') {
            body = init.body
        } else if (init.body) {
            body = JSON.stringify(init.body)
        } else {
            body = ''
        }

        const authorization = generateEdgeGridAuth({
            client_secret: credentials.client_secret,
            client_token: credentials.client_token,
            access_token: credentials.access_token,
            method,
            url,
            body
        })

        return fetch(input, {
            ...init,
            headers: {
                ...init.headers,
                Authorization: authorization
            }
        })
    }
}
