import { selectors, data } from './config'

const authUrlRegex = /^https:\/\/auth\.monzo\.com\/\?client_id=oauth2client_00009xjM6jHY2zK9LQG2wj&redirect_uri=http%3A%2F%2Flocalhost%3A\d+&response_type=code&state=[a-z0-9]{7,}$/

const getCsrfToken = () => page.$eval(selectors.csrfTokenInput, (e) => e.value)

const getFormValidity = () => page.$eval('form', (e) => e.checkValidity())

test('title', async () => {
  await expect(page).toEqualText('h1', 'monzo-oauth')
  expect(await page.title()).toBe('monzo-oauth')
})

test('auto-fill redirectUri', async () => {
  await expect(page).toEqualValue(selectors.redirectUriInput, data.redirectUri)
})

test('auto-fill unique csrfToken', async () => {
  const csrf1 = await getCsrfToken()
  expect(csrf1).toMatch(/[a-z0-9]{7,}/)

  await page.reload()
  const csrf2 = await getCsrfToken()
  expect(csrf2).toMatch(/[a-z0-9]{7,}/)

  expect(csrf1).not.toMatch(csrf2)
})

test('redirect', async () => {
  await page.fill(selectors.clientIdInput, data.clientId)
  expect(await getFormValidity()).toBe(false)

  await page.fill(selectors.clientSecretInput, 'mnzconf.sample')
  expect(await getFormValidity()).toBe(true)

  await page.fill(selectors.clientSecretInput, data.clientSecret)
  expect(await getFormValidity()).toBe(true)

  await page.click(selectors.submitButton)
  await expect(page).toEqualText('h2', data.clientName)
  expect(page.url()).toMatch(authUrlRegex)
  expect(decodeURIComponent(page.url())).toContain(data.redirectUri)
})
