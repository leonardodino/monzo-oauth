/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

const selectors = {
  csrfTokenInput: 'form input[name="csrfToken"]',
  redirectUriInput: 'form input[value^="http"]',
  clientIdInput: 'form input[placeholder^="oauth2client_"]',
  clientSecretInput: 'form input[placeholder^="mnzconf."]',
  submitButton: 'form button[type="submit"]',
}

const data = {
  redirectUri: `http://localhost:${process.env.PORT}`,
  clientName: 'monzo-oauth-e2e-test',
  clientSecret:
    'mnzpub.l2yBeJK2GARi8Fb5hpntxLL6ZKVuNw42rUtb49GMfubr1BDYxm3dcMBwbpcP4DqqWPWRkNGAg3h3afcHiRa9',
  clientId: 'oauth2client_00009xjM6jHY2zK9LQG2wj',
}

const authUrlRegex = /^https:\/\/auth\.monzo\.com\/\?client_id=oauth2client_00009xjM6jHY2zK9LQG2wj&redirect_uri=http%3A%2F%2Flocalhost%3A\d+&response_type=code&state=[a-z0-9]{7,}$/

const getCsrfToken = () =>
  page.$eval<string, HTMLInputElement>(selectors.csrfTokenInput, (e) => e.value)

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
  await page.waitForNavigation()
  expect(page.url()).toMatch(authUrlRegex)
  expect(decodeURIComponent(page.url())).toContain(data.redirectUri)
  await expect(page).toEqualText('h2', data.clientName)
})
