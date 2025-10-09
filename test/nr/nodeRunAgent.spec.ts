import { beforeEach, expect, it, vi } from 'vitest'
import { parseNr, serializeCommand } from '../../src/commands'

const agent = 'npm'
const [majorNodeVersion] = process.versions.node.split('.').map(Number)
const supportsNodeRun = majorNodeVersion >= 22

function _(arg: string, expected: string) {
  return async () => {
    expect(
      serializeCommand(await parseNr(agent, arg.split(' ').filter(Boolean))),
    ).toBe(
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

it('empty', supportsNodeRun ? _('', 'node --run start') : expectError(''))

it('if-present', supportsNodeRun ? _('test --if-present', 'node --run test') : expectError('test --if-present'))

it('script', supportsNodeRun ? _('dev', 'node --run dev') : expectError('dev'))

it('script with arguments', supportsNodeRun ? _('build --watch -o', 'node --run build --watch -o') : expectError('build --watch -o'))

it('colon', supportsNodeRun ? _('build:dev', 'node --run build:dev') : expectError('build:dev'))
