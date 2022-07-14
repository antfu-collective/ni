import { expect, test } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'bun'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNa(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'bun'))
test('foo', _('foo', 'bun foo'))
test('run test', _('run test', 'bun run test'))
