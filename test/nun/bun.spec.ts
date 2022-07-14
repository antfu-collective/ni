import { expect, test } from 'vitest'
import { parseNun } from '../../src/commands'

const agent = 'bun'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNun(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('single uninstall', _('axios', 'bun remove axios'))

test('multiple', _('eslint @types/node', 'bun remove eslint @types/node'))

test('global', _('eslint ni -g', 'bun remove -g eslint ni'))
