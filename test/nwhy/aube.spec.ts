import { expect, it } from 'vitest'
import { parseNwhy, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNwhy(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('single package', _('lodash', 'aube why lodash'))

it('with flags', _('lodash --json', 'aube why lodash --json'))
