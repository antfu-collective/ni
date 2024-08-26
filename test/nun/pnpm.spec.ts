import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single add', _('axios', 'pnpm remove axios'))

it('multiple', _('eslint @types/node', 'pnpm remove eslint @types/node'))

it('-D', _('-D eslint @types/node', 'pnpm remove -D eslint @types/node'))

it('global', _('eslint -g', 'pnpm remove --global eslint'))
