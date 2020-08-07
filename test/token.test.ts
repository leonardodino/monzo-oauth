import { data } from './config'
import { fill, navigate } from './utils'

// these tests require a mock server setup for intercepting calls.
// when running with npx setting this setup is not trivial, skip.
const test = process.env.npx ? it.skip : it

test('displays token for valid code and state', async () => {
  const { crsfToken } = await fill()
  await navigate('/', { code: data.goodCode, state: crsfToken })
  expect(await page.innerText('body')).not.toMatch('"error"')
  expect(await page.innerText('body')).toMatch(
    '  "access_token": "jwt_access_token"',
  )
})

test('displays error if code is invalid', async () => {
  const { crsfToken } = await fill()
  await navigate('/', { code: 'bad-code', state: crsfToken })
  expect(await page.innerText('body')).toMatch(
    '  "message": "An error occurred processing the request"',
  )
})

test('reports if the api returns something that is not json', async () => {
  const { crsfToken } = await fill()
  await navigate('/', { code: 'not-json', state: crsfToken })
  expect(await page.innerText('body')).toMatch(
    '  "error": "response is not json: \\"not-json\\""',
  )
})

test('reports invalid responses', async () => {
  const { crsfToken } = await fill()
  await navigate('/', { code: 'empty', state: crsfToken })
  expect(await page.innerText('body')).toMatch(
    '  "error": "response is not json: \\"\\""',
  )
})

test('reports network errors', async () => {
  const { crsfToken } = await fill()
  await navigate('/', { code: 'net-error', state: crsfToken })
  expect(await page.innerText('body')).toMatch(
    '  "error": "some network error"',
  )
})
