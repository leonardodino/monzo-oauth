import { navigate } from './test/utils'

beforeEach(async () => {
  page.setDefaultTimeout(5000)
  await navigate('/')
})
