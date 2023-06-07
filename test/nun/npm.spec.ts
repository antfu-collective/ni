import { expect, test } from 'vitest'
import { parseNun } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNun(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single uninstall', _('axios', 'npm uninstall axios'))

test('multiple', _('eslint @types/node', 'npm uninstall eslint @types/node'))

test('-D', _('eslint @types/node -D', 'npm uninstall eslint @types/node -D'))

test('global', _('eslint -g', 'npm uninstall -g eslint'))
