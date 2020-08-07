import { data } from './config'
import { navigate, fillWith } from './utils'

test('errors if the csrfToken is not found in memory', async () => {
  await navigate('/', { code: data.goodCode, state: 'x' })
  await expect(page).toHaveText('"error": "unknown \\"state\\""')
})

test('errors if the missing csrfToken', async () => {
  await navigate('/', { code: data.goodCode })
  await expect(page).toHaveText('"error": "invalid query string"')
})

test('errors if the missing code', async () => {
  await navigate('/', { state: 'x' })
  await expect(page).toHaveText('"error": "invalid query string"')
})

test.each([['clientId'], ['clientSecret']])(
  'errors if submitted with missing "%s" field',
  async (field) => {
    // disable validation so we can actually submit
    await page.$eval('form', (e) => (e.noValidate = true))
    await Promise.all([page.waitForNavigation(), fillWith({[field]: ''})])
    await expect(page).toHaveText('body', '"error": "invalid values"')
  },
)
