import { expect, test } from 'vitest'
import { parseNlx } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNlx(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single uninstall', _('esbuild', 'pnpm dlx esbuild'))
test('multiple', _('esbuild --version', 'pnpm dlx esbuild --version'))
