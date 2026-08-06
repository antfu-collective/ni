import { expect, it } from 'vitest'
import { parseNup, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNup(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'aube update'))

it('interactive', _('-i', 'aube update -i'))

it('interactive latest', _('-i --latest', 'aube update -i --latest'))
