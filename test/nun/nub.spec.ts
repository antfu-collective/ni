import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single', _('axios', 'nub remove axios'))

it('multiple', _('eslint @types/node', 'nub remove eslint @types/node'))

it('forwards flags', _('-D eslint @types/node', 'nub remove -D eslint @types/node'))

it('global', _('eslint -g', 'nub remove -g eslint'))
