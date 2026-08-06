import { expect, it } from 'vitest'
import { parseNlx, serializeCommand } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNlx(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('esbuild', 'yarn dlx esbuild'))
it('multiple', _('esbuild --version', 'yarn dlx esbuild --version'))
it('local', _('--local esbuild', 'yarn exec esbuild'))
it('local with arguments', _('--local esbuild --version', 'yarn exec esbuild --version'))
