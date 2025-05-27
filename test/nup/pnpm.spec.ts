import { expect, it } from 'vitest'
import { parseNup, serializeCommand } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNup(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'pnpm update'))

it('interactive', _('-i', 'pnpm update -i'))

it('interactive latest', _('-i --latest', 'pnpm update -i --latest'))
