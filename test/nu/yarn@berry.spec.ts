import { expect, it } from 'vitest'
import { parseNu, serializeCommand } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNu(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'yarn up'))

it('interactive', _('-i', 'yarn up -i'))
