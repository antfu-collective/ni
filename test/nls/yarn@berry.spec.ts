import { expect, test } from 'vitest'
import { parseNls } from '../../src/commands'

const agent = 'yarn@berry'
const _ = (arg: string, expected: string) => () => {
  expect(parseNls(agent, arg.split(' ').filter(Boolean))).toBe(expected)
}

test('list', _('', 'yarn info -A -R --name-only --depth 0'))
