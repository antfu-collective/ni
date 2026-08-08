import { expect, it } from 'vitest'
import { parseNlx, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNlx(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single', _('esbuild', 'nubx esbuild'))
it('with arguments', _('esbuild --version', 'nubx esbuild --version'))
it('local', _('--local esbuild', 'nub exec esbuild'))
