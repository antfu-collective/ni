import { expect, it } from 'vitest'
import { parseNi, serializeCommand } from '../../src/commands'

const agent = 'nub'

function _(hasLock: boolean, expected: string) {
  return async () => {
    const command = await parseNi(agent, ['--frozen-if-present'], { hasLock })
    expect(serializeCommand(command)).toBe(expected)
  }
}

it('uses a frozen install when a lockfile exists', _(true, 'nub install --frozen-lockfile'))

it('uses a regular install when no lockfile exists', _(false, 'nub install'))
