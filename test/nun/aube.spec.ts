import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single', _('axios', 'aube remove axios'))

it('multiple', _('eslint @types/node', 'aube remove eslint @types/node'))

it('forwards flags', _('-D eslint @types/node', 'aube remove -D eslint @types/node'))

it('global', _('eslint -g', 'aube remove -g eslint'))
