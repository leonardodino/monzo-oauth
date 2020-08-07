import { stringify, ParsedUrlQueryInput } from 'querystring'
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
