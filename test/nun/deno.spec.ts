import { expect, it } from 'vitest'
import { parseNun, serializeCommand } from '../../src/commands'

const agent = 'deno'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNun(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single uninstall', _('webpack', 'deno remove webpack'))
it('multiple', _('webpack eslint', 'deno remove webpack eslint'))
it('global', _('webpack -g', 'deno uninstall -g webpack'))
it('forward', _('webpack --save-dev', 'deno remove webpack --save-dev'))
