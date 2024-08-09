import { expect, it } from 'vitest'
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

it('single uninstall', _('esbuild', 'bun x esbuild'))
it('multiple', _('esbuild --version', 'bun x esbuild --version'))
