import { expect, it } from 'vitest'
import { parseNd, serializeCommand } from '../../src/commands'

const agent = 'aube'
function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNd(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
      expected,
    )
  }
}

it('empty', _('', 'aube dedupe'))

it('check', _('-c', 'aube dedupe --check'))
