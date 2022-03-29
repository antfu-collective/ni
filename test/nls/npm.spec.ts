import { expect, test } from 'vitest'
import { parseNls } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => () => {
  expect(parseNls(agent, arg.split(' ').filter(Boolean))).toBe(expected)
}

test('list', _('', 'npm list --depth 0'))
test('list depth 1', _('1', 'npm list --depth 1'))
test('list axios', _('axios', 'npm list axios'))
