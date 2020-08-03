/// <reference types="jest-playwright-preset" />

beforeEach(async () => {
  page.setDefaultTimeout(1000)
  await page.goto(`http://localhost:${process.env.PORT}`)
})
