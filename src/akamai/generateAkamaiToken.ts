import crypto from 'crypto'

interface EdgeGridOptions {
    client_secret: string
    client_token: string
    access_token: string
    method: string
    url: string
    body?: string
    headersToSign?: Record<string, string>
}

const MAX_BODY = 131072

function twoDigitNumberPad(number: number): string {
    return String(number).padStart(2, '0')
}

function createTimestamp(): string {
    const date = new Date()
    return (
        date.getUTCFullYear() +
        twoDigitNumberPad(date.getUTCMonth() + 1) +
        twoDigitNumberPad(date.getUTCDate()) +
        'T' +
        twoDigitNumberPad(date.getUTCHours()) +
        ':' +
        twoDigitNumberPad(date.getUTCMinutes()) +
        ':' +
        twoDigitNumberPad(date.getUTCSeconds()) +
        '+0000'
    )
}

function base64Sha256(data: string): string {
    const shasum = crypto.createHash('sha256').update(data)
    return shasum.digest('base64')
}

function base64HmacSha256(data: string, key: string): string {
    const encrypt = crypto.createHmac('sha256', key)
    encrypt.update(data)
    return encrypt.digest('base64')
}

function contentHash(method: string, body: string): string {
    let contentHashValue = ''
    let preparedBody = body || ''

    if (method === 'POST' && preparedBody.length > 0) {
        if (preparedBody.length > MAX_BODY) {
            preparedBody = preparedBody.substring(0, MAX_BODY)
        }
        contentHashValue = base64Sha256(preparedBody)
    }

    return contentHashValue
}

function canonicalizeHeaders(headers: Record<string, string> = {}): string {
    const formattedHeaders: string[] = []

    for (const key in headers) {
        formattedHeaders.push(key.toLowerCase() + ':' + headers[key].trim().replace(/\s+/g, ' '))
    }

    return formattedHeaders.join('\t')
}

function signingKey(timestamp: string, clientSecret: string): string {
    return base64HmacSha256(timestamp, clientSecret)
}

function dataToSign(
    method: string,
    url: string,
    headersToSign: Record<string, string>,
    contentHashValue: string,
    authHeader: string
): string {
    const parsedUrl = new URL(url)
    const dataArray = [
        method.toUpperCase(),
        parsedUrl.protocol.replace(':', ''),
        parsedUrl.host,
        parsedUrl.pathname + parsedUrl.search,
        canonicalizeHeaders(headersToSign),
        contentHashValue,
        authHeader
    ]

    return dataArray.join('\t')
}

function signRequest(
    method: string,
    url: string,
    headersToSign: Record<string, string>,
    contentHashValue: string,
    timestamp: string,
    clientSecret: string,
    authHeader: string
): string {
    const dataToSignStr = dataToSign(method, url, headersToSign, contentHashValue, authHeader)
    const key = signingKey(timestamp, clientSecret)
    return base64HmacSha256(dataToSignStr, key)
}

export const generateEdgeGridAuth = ({
    client_secret,
    client_token,
    access_token,
    method,
    url,
    body = '',
    headersToSign = {}
}: EdgeGridOptions): string => {
    const timestamp = createTimestamp()
    const nonce = crypto.randomUUID()

    const contentHashValue = contentHash(method, body)

    const authString =
        'EG1-HMAC-SHA256 ' +
        'client_token=' +
        client_token +
        ';' +
        'access_token=' +
        access_token +
        ';' +
        'timestamp=' +
        timestamp +
        ';' +
        'nonce=' +
        nonce +
        ';'

    const signature = signRequest(method, url, headersToSign, contentHashValue, timestamp, client_secret, authString)

    return authString + 'signature=' + signature
}
