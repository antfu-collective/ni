import type { ResolvedCommand } from 'package-manager-detector'
import { beforeEach, expect, it, vi } from 'vitest'
import { parseNr } from '../../src/commands'

const agent = 'npm'
const [majorNodeVersion] = process.versions.node.split('.').map(Number)
const supportsNodeRun = majorNodeVersion >= 22

function _(arg: string, expected: ResolvedCommand) {
  return async () => {
    expect(
      await parseNr(agent, arg.split(' ').filter(Boolean)),
    ).toEqual(
      expected,
    )
  }
}

function expectError(arg: string) {
  return async () => {
    await expect(
      parseNr(agent, arg.split(' ').filter(Boolean)),
    ).rejects.toThrow('requires Node.js 22.0.0 or higher')
  }
}

beforeEach(() => {
  vi.stubEnv('NI_RUN_AGENT', 'node')
})

it('empty', supportsNodeRun ? _('', { command: 'node', args: ['--run', 'start'] }) : expectError(''))

it('if-present', supportsNodeRun ? _('test --if-present', { command: 'node', args: ['--run', 'test'] }) : expectError('test --if-present'))

it('script', supportsNodeRun ? _('dev', { command: 'node', args: ['--run', 'dev'] }) : expectError('dev'))

it('script with arguments', supportsNodeRun ? _('build --watch -o', { command: 'node', args: ['--run', 'build', '--watch', '-o'] }) : expectError('build --watch -o'))

it('colon', supportsNodeRun ? _('build:dev', { command: 'node', args: ['--run', 'build:dev'] }) : expectError('build:dev'))
