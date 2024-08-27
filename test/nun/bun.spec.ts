import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('axios', 'bun remove axios'))

it('multiple', _('eslint @types/node', 'bun remove eslint @types/node'))

it('global', _('eslint ni -g', 'bun remove -g eslint ni'))
