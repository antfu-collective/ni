import { expect, it } from 'vitest'
import { parseNlx, serializeCommand } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNlx(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('esbuild', 'npx esbuild'))
it('multiple', _('esbuild --version', 'npx esbuild --version'))
