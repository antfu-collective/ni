import type { Runner } from '../../src'
import fs from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getCliCommand, parseNr } from '../../src'

const mocks = vi.hoisted(() => ({
  detectSpy: vi.fn(() => Promise.resolve('npm')),
}))
vi.mock('../../src/detect', () => ({
  detect: mocks.detectSpy,
}))

// Built outside the repository so that a real `.nirc` in the developer's home
// directory cannot be picked up by the upward traversal.
const project = fs.mkdtempSync(path.join(tmpdir(), 'ni-runner-'))
fs.writeFileSync(path.join(project, '.nirc'), 'globalAgent=yarn\nrunAgent=node\n')

beforeEach(() => {
  // vitest.config.ts pins this to disable discovery for the rest of the suite.
  vi.stubEnv('NI_CONFIG_FILE', '')
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

afterAll(() => {
  fs.rmSync(project, { recursive: true, force: true })
})

it('reads globalAgent from the .nirc of the directory being operated on', async () => {
  const fn = vi.fn<Runner>(() => Promise.resolve(undefined))

  await getCliCommand(fn, ['-g'], { programmatic: true }, project)

  expect(fn).toHaveBeenCalledWith('yarn', ['-g'])
})

it('reads runAgent from the .nirc of the directory being operated on', async () => {
  const command = await getCliCommand(parseNr, ['dev'], { programmatic: true }, project)

  expect(command?.command).toBe('node')
})
