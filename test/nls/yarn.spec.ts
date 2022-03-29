import { expect, test } from 'vitest'
import { parseNls } from '../../src/commands'

const agent = 'yarn'
const _ = (arg: string, expected: string) => () => {
  expect(parseNls(agent, arg.split(' ').filter(Boolean))).toBe(expected)
}

test('list', _('', 'yarn list --depth 0'))
test('list depth 1', _('1', 'yarn list --depth 1'))
test('list axios', _('axios', 'yarn list axios'))
