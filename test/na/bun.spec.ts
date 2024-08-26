import { expect, it } from 'vitest'
import { parseNa, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNa(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'bun'))
it('foo', _('foo', 'bun foo'))
it('run test', _('run test', 'bun run test'))
