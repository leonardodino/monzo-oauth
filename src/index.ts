#!/usr/bin/env ts-node

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { request } from 'https'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parse, stringify } from 'querystring'

const hostname = 'localhost'
let port = process.env.PORT ? parseInt(process.env.PORT) : 5000

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

const isStartBody = (input: any): input is StartBody => {
  if (!input || typeof input !== 'object') return false
  return ['clientId', 'clientSecret', 'redirectUri', 'csrfToken'].every(
    (property) => input[property] && typeof input[property] === 'string',
  )
}

const isCodeQueryString = (input: any): input is CodeQueryString => {
  if (!input || typeof input !== 'object') return false
  return ['code', 'state'].every(
    (property) => input[property] && typeof input[property] === 'string',
  )
}

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

    const req = request(tokenUrl, options, (res) => {
      if (!res.statusCode || res.statusCode > 299) {
        return reject(`HTTP ${res.statusCode || '000'} ${res.statusMessage}`)
      }
      read(res).then(JSON.parse).then(resolve, reject)
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

  if (req.method === 'GET' && /\?./.test(req.url || '')) {
    const qs = parse(req.url!.replace(/^.+\?/, ''))
    if (!isCodeQueryString(qs)) throw 'invalid query string'
    const data = memory.get(qs.state)
    if (!data) throw 'unknown "state"'
    return renderJSON(await fetchToken(data, qs.code))
  }

  return renderForm({
    redirectUri: req.headers.origin || `http://${hostname}:${port}`,
    csrfToken: generateCsrfToken(),
  })
}

const server = createServer((req, res) => {
  const request = `${req.method} ${req.url?.replace(/\?.*/, '')}`
  const promise = handler(req, res).then(
    (body) => res.end(body),
    (error) => {
      const status = typeof error === 'string' ? 400 : 500
      if (!res.headersSent) res.statusCode = status
      res.end(renderJSON({ error: error?.message || error || 'unknown' }))
    },
  )
  console.time(request)
  promise.then(() => console.timeEnd(request))
})

const listener = server.listen(port, hostname, () => {
  const address = listener.address()
  port = (typeof address === 'object' && address?.port) || port
  console.log(`server listening on http://${hostname}:${port}`)
})
