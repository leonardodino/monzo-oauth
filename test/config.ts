export const selectors = {
  csrfTokenInput: 'form input[name="csrfToken"]' as 'input',
  redirectUriInput: 'form input[value^="http"]' as 'input',
  clientIdInput: 'form input[placeholder^="oauth2client_"]' as 'input',
  clientSecretInput: 'form input[placeholder^="mnzconf."]' as 'input',
  submitButton: 'form button[type="submit"]' as 'button',
}

export const data = {
  redirectUri: `http://localhost:${process.env.PORT}`,
  clientName: 'monzo-oauth-e2e-test',
  clientSecret:
    'mnzpub.l2yBeJK2GARi8Fb5hpntxLL6ZKVuNw42rUtb49GMfubr1BDYxm3dcMBwbpcP4DqqWPWRkNGAg3h3afcHiRa9',
  clientId: 'oauth2client_00009xjM6jHY2zK9LQG2wj',
  goodCode: 'x-good-code',
}
