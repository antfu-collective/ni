import { expect, test } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'yarn@berry'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNa(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'yarn'))
test('foo', _('foo', 'yarn foo'))
test('run test', _('run test', 'yarn run test'))
