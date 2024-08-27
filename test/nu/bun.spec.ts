import { expect, it } from 'vitest'
import { parseNu, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string | null) {
  return async () => {
    expect(
      serializeCommand(await parseNu(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it.fails('empty', _('', null))
it.fails('interactive', _('-i', null))
it.fails('interactive latest', _('-i --latest', null))
