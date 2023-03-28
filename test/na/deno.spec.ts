import { expect, test } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'deno'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNa(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'deno'))
test('foo', _('foo', 'deno foo'))
test('run test', _('run test', 'deno run test'))
