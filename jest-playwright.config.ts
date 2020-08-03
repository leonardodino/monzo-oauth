const CI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true'
const e2e = process.env.e2e === 'true'
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000
process.env.PORT = port.toString()

if (port === 0) throw new Error('PORT=0 is not supported during tests')

const command = e2e ? 'npx -q monzo-oauth-*' : 'ts-node ./src/server.ts'

module.exports = {
  // browsers: ['chromium', 'webkit', 'firefox'],
  launchOptions: CI ? { args: ['--no-sandbox'] } : {},
  serverOptions: { command, port, options: { env: process.env } },
}
