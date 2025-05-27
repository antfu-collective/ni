import type { MockInstance } from 'vitest'
import type { Runner } from '../../src'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { AGENTS, parseNa, parseNi, parseNlx, parseNun, parseNup, runCli } from '../../src'

let basicLog: MockInstance, errorLog: MockInstance, warnLog: MockInstance, infoLog: MockInstance

function runCliTest(fixtureName: string, agent: string, runner: Runner, args: string[]) {
  return async () => {
    const cwd = await fs.mkdtemp(path.join(tmpdir(), 'ni-'))
    const fixture = path.join(__dirname, '..', 'fixtures', fixtureName, agent)
    await fs.cp(fixture, cwd, { recursive: true })

    await runCli(
      async (agent, _, ctx) => {
        // we override the args to be test specific
        return runner(agent, args, ctx)
      },
      {
        programmatic: true,
        cwd,
        args,
      },
    ).catch((e) => {
      // it will always throw if ezspawn is mocked
      if (e.command)
        expect(e.command).toMatchSnapshot()
      else
        expect(e.message).toMatchSnapshot()
    })
  }
}

beforeAll(() => {
  basicLog = vi.spyOn(console, 'log')
  warnLog = vi.spyOn(console, 'warn')
  errorLog = vi.spyOn(console, 'error')
  infoLog = vi.spyOn(console, 'info')

  vi.mock('tinyexec', async (importOriginal) => {
    const mod = await importOriginal() as any
    return {
      ...mod,
      x: (cmd: string, args?: string[]) => {
        // break execution flow for easier snapshotting
        // eslint-disable-next-line no-throw-literal
        throw { command: [cmd, ...(args ?? [])].join(' ') }
      },
    }
  })
})

afterAll(() => {
  vi.resetAllMocks()
})

const agents = [...AGENTS, 'unknown']
const fixtures = ['lockfile', 'packager']
const skippedAgents = ['deno']

// matrix testing of: fixtures x agents x commands
fixtures.forEach(fixture => describe(fixture, () => agents.forEach(agent => describe(agent, () => {
  if (skippedAgents.includes(agent))
    return it.skip(`skipped for ${agent}`, () => {})

  /** na */
  it('na', runCliTest(fixture, agent, parseNa, []))
  it('na run foo', runCliTest(fixture, agent, parseNa, ['run', 'foo']))

  /** ni */
  it('ni', runCliTest(fixture, agent, parseNi, []))
  it('ni foo', runCliTest(fixture, agent, parseNi, ['foo']))
  it('ni foo -D', runCliTest(fixture, agent, parseNi, ['foo', '-D']))
  it('ni --frozen', runCliTest(fixture, agent, parseNi, ['--frozen']))
  it('ni -g foo', runCliTest(fixture, agent, parseNi, ['-g', 'foo']))

  /** nlx */
  it('nlx', runCliTest(fixture, agent, parseNlx, ['foo']))

  /** nup */
  it('nup', runCliTest(fixture, agent, parseNup, []))
  it('nup -i', runCliTest(fixture, agent, parseNup, ['-i']))

  /** nun */
  it('nun foo', runCliTest(fixture, agent, parseNun, ['foo']))
  it('nun -g foo', runCliTest(fixture, agent, parseNun, ['-g', 'foo']))

  it('no logs', () => {
    expect(basicLog).not.toHaveBeenCalled()
    expect(warnLog).not.toHaveBeenCalled()
    expect(errorLog).not.toHaveBeenCalled()
    expect(infoLog).not.toHaveBeenCalled()
  })
}))))

// https://github.com/antfu-collective/ni/issues/266
describe('debug mode', () => {
  beforeAll(() => basicLog.mockClear())

  it('ni', runCliTest('lockfile', 'npm', parseNi, ['@antfu/ni', '?']))
  it('should return command results in plain text format', () => {
    expect(basicLog).toHaveBeenCalled()

    expect(basicLog.mock.calls[0][0]).toMatchSnapshot()
  })
})
