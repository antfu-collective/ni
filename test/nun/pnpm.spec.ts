import { expect, test } from 'vitest'
import { parseNun } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNun(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single add', _('axios', 'pnpm remove axios'))

test('multiple', _('eslint @types/node', 'pnpm remove eslint @types/node'))

test('-D', _('-D eslint @types/node', 'pnpm remove -D eslint @types/node'))

test('global', _('eslint -g', 'pnpm remove --global eslint'))
