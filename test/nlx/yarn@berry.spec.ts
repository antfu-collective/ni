import { expect, test } from 'vitest'
import { parseNlx } from '../../src/commands'

const agent = 'yarn@berry'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNlx(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('single uninstall', _('esbuild', 'yarn dlx esbuild'))
test('multiple', _('esbuild --version', 'yarn dlx esbuild --version'))
