import { expect, test } from 'vitest'
import { parseNx } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNx(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('single uninstall', _('esbuild', 'npx esbuild'))
test('multiple', _('esbuild --version', 'npx esbuild --version'))
