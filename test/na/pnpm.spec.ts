import { expect, it } from 'vitest'
import { parseNa, serializeCommand } from '../../src/commands'

const agent = 'pnpm'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNa(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'pnpm'))
it('foo', _('foo', 'pnpm foo'))
it('run test', _('run test', 'pnpm run test'))
