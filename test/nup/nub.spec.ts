import { expect, it } from 'vitest'
import { parseNup, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNup(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'nub update'))

it('interactive', _('-i', 'nub update -i'))

it('interactive latest', _('-i --latest', 'nub update -i --latest'))
