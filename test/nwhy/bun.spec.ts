import { expect, it } from 'vitest'
import { parseNwhy, serializeCommand } from '../../src/commands'

const agent = 'bun'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNwhy(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single package', _('lodash', 'bun why lodash'))

it('with flags', _('lodash --json', 'bun why lodash --json'))
