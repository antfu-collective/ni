import { expect, it } from 'vitest'
import { parseNa, serializeCommand } from '../../src/commands'

const agent = 'yarn'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNa(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'yarn'))
it('foo', _('foo', 'yarn foo'))
it('run test', _('run test', 'yarn run test'))
