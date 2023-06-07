import { expect, test } from 'vitest'
import { parseNlx } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNlx(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

test('single uninstall', _('esbuild', 'npx esbuild'))
test('multiple', _('esbuild --version', 'npx esbuild --version'))
