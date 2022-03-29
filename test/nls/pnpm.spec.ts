import { expect, test } from 'vitest'
import { parseNls } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => () => {
  expect(parseNls(agent, arg.split(' ').filter(Boolean))).toBe(expected)
}

test('list', _('', 'pnpm list --depth 0'))
test('list depth 1', _('1', 'pnpm list --depth 1'))
test('list axios', _('axios', 'pnpm list axios'))
