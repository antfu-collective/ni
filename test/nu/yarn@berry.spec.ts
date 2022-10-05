import { expect, test } from 'vitest'
import { parseNu } from '../../src/commands'

const agent = 'yarn@berry'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNu(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'yarn up'))

test('interactive', _('-i', 'yarn up -i'))
