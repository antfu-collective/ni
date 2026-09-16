import { expect, it } from 'vitest'
import { parseNd, serializeCommand } from '../../src/commands'

const agent = 'nub'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNd(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'nub dedupe'))

it('check', _('-c', 'nub dedupe --check'))
