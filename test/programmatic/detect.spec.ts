import type { MockInstance } from 'vitest'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AGENTS, detect } from '../../src'

let basicLog: MockInstance, errorLog: MockInstance, warnLog: MockInstance, infoLog: MockInstance

function detectTest(fixture: string, agent: string) {
  return async () => {
    const cwd = await fs.mkdtemp(path.join(tmpdir(), 'ni-'))
    const dir = path.join(__dirname, '..', 'fixtures', fixture, agent)
    await fs.cp(dir, cwd, { recursive: true })

    expect(await detect({ programmatic: true, cwd })).toMatchSnapshot()
  }
}

beforeAll(() => {
  basicLog = vi.spyOn(console, 'log')
  warnLog = vi.spyOn(console, 'warn')
  errorLog = vi.spyOn(console, 'error')
  infoLog = vi.spyOn(console, 'info')
})

afterAll(() => {
  vi.resetAllMocks()
})

const agents = [...AGENTS, 'unknown']
const fixtures = ['lockfile', 'packager']
const skippedAgents = ['deno']

// matrix testing of: fixtures x agents
fixtures.forEach(fixture => describe(fixture, () => agents.forEach((agent) => {
  if (skippedAgents.includes(agent))
    return it.skip(`skipped for ${agent}`, () => {})

  it(agent, detectTest(fixture, agent))

  it('no logs', () => {
    expect(basicLog).not.toHaveBeenCalled()
    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
    expect(infoLog).not.toHaveBeenCalled()
  })
})))
