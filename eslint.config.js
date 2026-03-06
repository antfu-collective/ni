// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: true,
})
  .removeRules(
    'markdown/heading-increment',
    'e18e/prefer-static-regex',
  )
