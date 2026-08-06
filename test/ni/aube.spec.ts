import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'aube install'))

it('single add', _('axios', 'aube add axios'))

it('multiple', _('eslint @types/node', 'aube add eslint @types/node'))

it('-D', _('-D eslint @types/node', 'aube add -D eslint @types/node'))

it('global', _('eslint -g', 'aube add -g eslint'))

it('frozen', _('--frozen', 'aube install --frozen-lockfile'))

it('forwards long install flags', _('--anything', 'aube install --anything'))

it('forwards short install flags', _('-a', 'aube install -a'))

it('production', _('-P', 'aube install --production'))

it('frozen production', _('--frozen -P', 'aube install --frozen-lockfile --production'))
