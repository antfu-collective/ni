import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNi(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'deno install'))

it('single add', _('axios', 'deno add axios'))

it('multiple', _('eslint @types/node', 'deno add eslint @types/node'))

it('-D', _('eslint @types/node -D', 'deno add eslint @types/node -D'))

it('global', _('eslint -g', 'deno install -g eslint'))

it('frozen', _('--frozen', 'deno install --frozen'))

it('production', _('-P', 'deno install --production'))

it('frozen production', _('--frozen -P', 'deno install --frozen --production'))
