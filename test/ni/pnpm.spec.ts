import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'pnpm i'))

it('single add', _('axios', 'pnpm add axios'))

it('multiple', _('eslint @types/node', 'pnpm add eslint @types/node'))

it('-D', _('-D eslint @types/node', 'pnpm add -D eslint @types/node'))

it('global', _('eslint -g', 'pnpm add -g eslint'))

it('frozen', _('--frozen', 'pnpm i --frozen-lockfile'))

it('forward1', _('--anything', 'pnpm i --anything'))
it('forward2', _('-a', 'pnpm i -a'))

it('production', _('-P', 'pnpm i --production'))

it('frozen production', _('--frozen -P', 'pnpm i --frozen-lockfile --production'))
