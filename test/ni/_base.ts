import { expect } from 'vitest'
import type { RunnerReturn } from '../../src/commands'
import { parseNi } from '../../src/commands'
import type { Agent } from '../../src/agents'

export const parseNaTest = (agent: Agent) => {
  return (arg: string, expected: RunnerReturn) => () => {
    expect(
      parseNi(agent, arg.split(' ').filter(Boolean)),
    ).toEqual(expected)
  }
}

const platformRmDir = process.platform === 'win32' ? 'rmdir /s /q' : 'rm -rf'
export const promptRemoveOfNodeModules = { prompt: 'Remove ./node_modules folder?', command: `${platformRmDir} ./node_modules` }
