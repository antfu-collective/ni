import { expect } from 'vitest'
import type { TestFunction } from 'vitest'
import type { Runner } from '../src'
import type { Agent } from '../src/agents'

type Assert = (arg: string, expected: string | null) => TestFunction | undefined
type AssertFactory = (command: Runner, agent: Agent) => Assert

export const assertFactory: AssertFactory = (command, agent) => (arg, expected) => () => {
  expect(
    command(agent, arg.split(' ').filter(Boolean)),
  ).toBe(
    expected,
  )
}
