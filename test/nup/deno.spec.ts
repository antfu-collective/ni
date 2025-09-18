import { expect, it } from 'vitest'
import { parseNup, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNup(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'deno outdated --update'))

it('interactive', _('-i', 'deno outdated --update'))

it('interactive latest', _('-i --latest', 'deno outdated --update --latest'))
