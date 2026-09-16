import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'nub install'))

it('single add', _('axios', 'nub add axios'))

it('multiple', _('eslint @types/node', 'nub add eslint @types/node'))

it('-D', _('-D eslint @types/node', 'nub add -D eslint @types/node'))

it('global', _('eslint -g', 'nub add -g eslint'))

it('frozen', _('--frozen', 'nub install --frozen-lockfile'))

it('forwards long install flags', _('--anything', 'nub install --anything'))

it('forwards short install flags', _('-a', 'nub install -a'))

it('production', _('-P', 'nub install --production'))

it('frozen production', _('--frozen -P', 'nub install --frozen-lockfile --production'))
