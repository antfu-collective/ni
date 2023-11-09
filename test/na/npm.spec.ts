import { expect, it } from 'vitest'
import { parseNa } from '../../src/commands'

const agent = 'npm'
function _(arg: string, expected: string) {
  return () => {
    expect(
      parseNa(agent, arg.split(' ').filter(Boolean)),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'npm'))
it('foo', _('foo', 'npm foo'))
it('run test', _('run test', 'npm run test'))
