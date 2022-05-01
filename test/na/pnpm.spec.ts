import { expect, test } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'pnpm'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNa(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'pnpm'))
test('foo', _('foo', 'pnpm foo'))
test('run test', _('run test', 'pnpm run test'))
