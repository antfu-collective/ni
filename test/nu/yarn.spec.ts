import { expect, it } from 'vitest'
import { parseNu, serializeCommand } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNu(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'yarn upgrade'))

it('interactive', _('-i', 'yarn upgrade-interactive'))

it('interactive latest', _('-i --latest', 'yarn upgrade-interactive --latest'))
