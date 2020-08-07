import { parse } from 'querystring'
import { RequestInterceptor } from 'node-request-interceptor'
import { data } from './config'

new RequestInterceptor().use((req) => {
  if (
    req.body &&
    req.headers &&
    req.method === 'POST' &&
    req.url.host === 'api.monzo.com' &&
    req.url.pathname === '/oauth2/token'
  ) {
    const { code, client_id } = parse(req.body)

    switch (code) {
      case data.goodCode:
        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: 'jwt_access_token',
            client_id: client_id,
            expires_in: 108000,
            scope: 'third_party_developer_app.pre_verification',
            token_type: 'Bearer',
            user_id: 'user_0000',
          }),
        }
      case 'not-json':
        return {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: code,
        }
      case 'empty':
        return { status: 200 }
      case 'net-error':
        throw new Error('some network error')
    }

    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'internal_service',
        message: 'An error occurred processing the request',
      }),
    }
  }

  // fail fast with net::ERR_CONNECTION_REFUSED
  process.exit(1)
})
