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

it('single uninstall', _('esbuild', 'deno run npm:esbuild'))
it('multiple', _('esbuild --version', 'deno run npm:esbuild --version'))
it('vitest', _('vitest', 'deno run npm:vitest'))
it('with args', _('typescript --version', 'deno run npm:typescript --version'))
