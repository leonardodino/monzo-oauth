const CI = process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true'
const npx = process.env.npx === 'true'
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000
process.env.PORT = port.toString()

if (port === 0) throw new Error('PORT=0 is not supported during tests')

const command = npx ? 'npx ./monzo-oauth.tgz' : 'ts-node ./src'
const usedPortAction = CI ? 'kill' : 'error'
const options = { env: process.env }

module.exports = {
  // browsers: ['chromium', 'webkit', 'firefox'],
  launchOptions: CI ? { args: ['--no-sandbox'] } : {},
  serverOptions: { command, port, options, usedPortAction },
}
