import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'bun install'))

it('single add', _('axios', 'bun add axios'))

it('add dev', _('vite -D', 'bun add vite -d'))

it('multiple', _('eslint @types/node', 'bun add eslint @types/node'))

it('global', _('eslint -g', 'bun add -g eslint'))

it('frozen', _('--frozen', 'bun install --frozen-lockfile'))

it('production', _('-P', 'bun install --production'))

it('frozen production', _('--frozen -P', 'bun install --frozen-lockfile --production'))
