import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('axios', 'npm uninstall axios'))

it('multiple', _('eslint @types/node', 'npm uninstall eslint @types/node'))

it('-D', _('eslint @types/node -D', 'npm uninstall eslint @types/node -D'))

it('global', _('eslint -g', 'npm uninstall -g eslint'))
