import { expect, test } from 'vitest'
import { parseNix } from '../../src/commands'

const agent = 'bun'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNix(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('single uninstall', _('esbuild', 'bunx esbuild'))
test('multiple', _('esbuild --version', 'bunx esbuild --version'))
