import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single add', _('axios', 'yarn remove axios'))

it('multiple', _('eslint @types/node', 'yarn remove eslint @types/node'))

it('-D', _('eslint @types/node -D', 'yarn remove eslint @types/node -D'))

it('global', _('eslint ni -g', 'npm uninstall -g eslint ni'))
