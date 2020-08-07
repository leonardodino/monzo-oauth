import { parse } from 'url'
import { stringify } from 'querystring'
import type {ParsedUrlQueryInput} from 'querystring'
import { selectors, data } from './config'

export const navigate = (path: string, query?: ParsedUrlQueryInput) => {
  const stringified = stringify(query)
  const qs = stringified ? `?${stringified}` : ''
  return page.goto(`http://localhost:${process.env.PORT}${path}${qs}`)
}

export const fillWith = async ({
  clientId = data.clientId,
  clientSecret = data.clientSecret,
} = {}): Promise<void> => {
  await page.fill(selectors.clientIdInput, clientId)
  await page.fill(selectors.clientSecretInput, clientSecret)
  await page.click(selectors.submitButton)
}

export const fill = async (): Promise<{ crsfToken: string }> => {
  const [navigation] = await Promise.all([
    page.waitForNavigation({ url: 'https://auth.monzo.com/*' }),
    fillWith(),
  ])
  const { query } = parse(navigation!.request().url(), true)
  expect(query).toMatchObject({ state: expect.stringContaining('') })
  return { crsfToken: query.state as string }
}
