import { stringify, ParsedUrlQueryInput } from 'querystring'

export const navigate = (path: string, query?: ParsedUrlQueryInput) => {
  const stringified = stringify(query)
  const qs = stringified ? `?${stringified}` : ''
  return page.goto(`http://localhost:${process.env.PORT}${path}${qs}`)
}
