import { expect, test } from 'vitest'
import { parseNu } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNu(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('empty', _('', 'npm update'))
