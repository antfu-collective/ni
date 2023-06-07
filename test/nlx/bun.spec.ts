import { expect, test } from 'vitest'
import { parseNlx } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNlx(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single uninstall', _('esbuild', 'bunx esbuild'))
test('multiple', _('esbuild --version', 'bunx esbuild --version'))
