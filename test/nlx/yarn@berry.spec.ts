import { expect, it } from 'vitest'
import { parseNlx } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNlx(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('esbuild', 'yarn dlx esbuild'))
it('multiple', _('esbuild --version', 'yarn dlx esbuild --version'))
