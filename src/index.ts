#!/usr/bin/env ts-node

import { createServer } from 'http'
import { request } from 'https'
import { readFileSync } from 'fs'
import { parse as parseUrl } from 'url'
import { join } from 'path'
import { parse, stringify } from 'querystring'
import type { IncomingMessage, ServerResponse } from 'http'
import type { ParsedUrlQuery } from 'querystring'
import type { AddressInfo } from 'net'

const hostname = 'localhost'
let port = process.env.PORT
  ? parseInt(process.env.PORT)
  : /* istanbul ignore next */ 5000

const loginUrl = 'https://auth.monzo.com/'
const tokenUrl = 'https://api.monzo.com/oauth2/token'

type StartBody = {
  clientId: string
  clientSecret: string
  redirectUri: string
  csrfToken: string
}

type CodeQueryString = {
  code: string
  state: string
}

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<string>

const isStartBody = (input: ParsedUrlQuery): input is StartBody =>
  ['clientId', 'clientSecret', 'redirectUri', 'csrfToken'].every(
    (property) => input[property] && typeof input[property] === 'string',
  )

const isCodeQueryString = (input: ParsedUrlQuery): input is CodeQueryString =>
  ['code', 'state'].every(
    (property) => input[property] && typeof input[property] === 'string',
  )

const memory = new Map<string, StartBody>()

const read = (readable: NodeJS.ReadableStream): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    let data = ''
    readable.setEncoding('utf8')
    readable.on('data', (chunk) => (data += chunk.toString()))
    readable.on('error', reject)
    readable.on('end', () => resolve(data))
  })

const generateCsrfToken = () => Math.random().toString(36).substring(2, 15)

const renderForm = (props: { csrfToken: string; redirectUri: string }) =>
  readFileSync(join(__dirname, 'form.html'), 'utf8')
    .toString()
    .replace('{{csrfToken}}', props.csrfToken)
    .replace('{{redirectUri}}', props.redirectUri)

const renderRedirect = (props: { authUrl: string }) =>
  readFileSync(join(__dirname, 'redirect.html'), 'utf8')
    .toString()
    .replace('{{authUrl}}', props.authUrl)

const renderJSON = (props: Record<string, any>) =>
  readFileSync(join(__dirname, 'json.html'), 'utf8')
    .toString()
    .replace('{{json}}', JSON.stringify(props, null, 2))

const fetchToken = (params: StartBody, code: string) =>
  new Promise<any>((resolve, reject) => {
    const body = Buffer.from(
      stringify({
        grant_type: 'authorization_code',
        client_id: params.clientId,
        client_secret: params.clientSecret,
        redirect_uri: params.redirectUri,
        code,
      }),
    )
    const options = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      },
    }

    const req = request(tokenUrl, options, (res): void => {
      read(res).then((body) => {
        if (res.headers['content-type']?.includes('application/json')) {
          Promise.resolve(body).then(JSON.parse).then(resolve, reject)
        } else {
          reject(`response is not json: "${body}"`)
        }
      }, reject)
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })

const handler: Handler = async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
  )

  if (
    req.method === 'POST' &&
    req.url === '/start' &&
    req.headers['content-type'] &&
    req.headers['content-type'].startsWith('application/x-www-form-urlencoded')
  ) {
    const body = parse(await read(req))
    if (!isStartBody(body)) throw 'invalid values'

    memory.set(body.csrfToken, body)

    const query = stringify({
      client_id: body.clientId,
      redirect_uri: body.redirectUri,
      response_type: 'code',
      state: body.csrfToken,
    })

    const authUrl = `${loginUrl}?${query}`
    res.statusCode = 201
    res.setHeader('Location', authUrl)
    res.setHeader('Refresh', `0; url=${authUrl}`)
    return renderRedirect({ authUrl })
  }

  if (req.method === 'GET' && req.url && /\?./.test(req.url)) {
    const { query } = parseUrl(req.url, true)
    if (!isCodeQueryString(query)) throw 'invalid query string'
    const data = memory.get(query.state)
    if (!data) throw 'unknown "state"'
    return renderJSON(await fetchToken(data, query.code))
  }

  return renderForm({
    redirectUri: req.headers.origin || `http://${hostname}:${port}`,
    csrfToken: generateCsrfToken(),
  })
}

const server = createServer((req, res) =>
  handler(req, res)
    .catch((error) => {
      res.statusCode = typeof error === 'string' ? 400 : 500
      return renderJSON({ error: error.message || error })
    })
    .then((body) => res.end(body)),
)

const listener = server.listen(port, hostname, () => {
  port = (listener.address() as AddressInfo).port
  console.log(`server listening on http://${hostname}:${port}`)
})
