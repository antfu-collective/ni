import { expect, test } from 'vitest'
import { parseNun } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNun(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single add', _('axios', 'yarn remove axios'))

test('multiple', _('eslint @types/node', 'yarn remove eslint @types/node'))

test('-D', _('eslint @types/node -D', 'yarn remove eslint @types/node -D'))

test('global', _('eslint ni -g', 'npm uninstall -g eslint ni'))
