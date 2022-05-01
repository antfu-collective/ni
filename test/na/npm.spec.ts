import { expect, test } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'npm'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNa(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'npm'))
test('foo', _('foo', 'npm foo'))
test('run test', _('run test', 'npm run test'))
