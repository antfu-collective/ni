import { expect, it } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'yarn@berry'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNa(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'yarn'))
it('foo', _('foo', 'yarn foo'))
it('run test', _('run test', 'yarn run test'))
