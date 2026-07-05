import { expect, it } from 'vitest'
import { parseNlx, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNlx(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('esbuild', 'deno x esbuild'))
it('multiple', _('esbuild --version', 'deno x esbuild --version'))
it('vitest', _('vitest', 'deno x vitest'))
it('with args', _('typescript --version', 'deno x typescript --version'))
