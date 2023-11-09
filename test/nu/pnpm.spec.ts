import { expect, it } from 'vitest'
import { parseNu } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNu(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'pnpm update'))

it('interactive', _('-i', 'pnpm update -i'))

it('interactive latest', _('-i --latest', 'pnpm update -i --latest'))
