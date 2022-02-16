import { test, expect } from 'vitest'
import { parseNu } from '../../src/commands'

const agent = 'yarn'
const _ = (arg: string, expected: string) => () => {
  expect(
    parseNu(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}

test('empty', _('', 'yarn upgrade'))

test('interactive', _('-i', 'yarn upgrade-interactive'))

test('interactive latest', _('-i --latest', 'yarn upgrade-interactive --latest'))
