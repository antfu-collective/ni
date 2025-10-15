import { expect, it } from 'vitest'
import { parseNup, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string | null) {
  return async () => {
    expect(
      serializeCommand(await parseNup(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'bun update'))

it('interactive', _('-i', 'bun update -i'))

it('interactive latest', _('-i --latest', 'bun update -i --latest'))
