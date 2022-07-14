import { expect, test } from 'vitest'
import { parseNu } from '../../src/commands'

const agent = 'bun'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNu(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'bun add'))

test('interactive', _('-i', 'bun add'))
