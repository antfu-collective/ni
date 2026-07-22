import type { Runner } from '../../src'
import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runCli } from '../../src'

// Mock detect to see what options are passed to it
const mocks = vi.hoisted(() => ({
  detectSpy: vi.fn(() => Promise.resolve('npm')),
  baseRunFnSpy: vi.fn<Runner>(() => Promise.resolve(undefined)),
}))
vi.mock('../../src/detect', () => ({
  detect: mocks.detectSpy,
}))

async function writeFixtureCommand(directory: string, selectedBinary: string) {
  const isWindows = process.platform === 'win32'
  const commandPath = path.join(directory, `fixture-pm${isWindows ? '.cmd' : ''}`)
  const command = isWindows
    ? `@echo ${selectedBinary}>"%NI_PATH_TEST_MARKER%"\r\n`
    : `#!/bin/sh\nprintf '${selectedBinary}' > "$NI_PATH_TEST_MARKER"\n`

  await fs.writeFile(commandPath, command)
  if (!isWindows)
    await fs.chmod(commandPath, 0o755)
}

describe('runCli', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('run without errors', async () => {
    const result = await runCli(mocks.baseRunFnSpy, {})
    expect(result).toBe(undefined)
  })

  it('handle errors in programmatic mode', async () => {
    await expect(
      runCli(() => {
        throw new Error('test error')
      }, { programmatic: true }),
    ).rejects.toThrow('test error')
  })

  it('calls detect with the correct options', async () => {
    await runCli(mocks.baseRunFnSpy)
    expect(mocks.detectSpy).toHaveBeenCalledWith(({ autoInstall: false, programmatic: false, cwd: expect.any(String) }))
  })

  it('detects environment options', async () => {
    vi.stubEnv('NI_AUTO_INSTALL', 'true')
    await runCli(mocks.baseRunFnSpy)
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: true, programmatic: false, cwd: expect.any(String) })
  })

  it('accepts options as input', async () => {
    await runCli(mocks.baseRunFnSpy, { autoInstall: true, programmatic: true })
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: true, programmatic: true, cwd: expect.any(String) })
  })

  it('uses the system PATH for package manager commands', async () => {
    const fixture = await fs.mkdtemp(path.join(tmpdir(), 'ni-path-'))
    const localBin = path.join(fixture, 'node_modules', '.bin')
    const systemBin = path.join(fixture, 'system-bin')
    const marker = path.join(fixture, 'selected.txt')
    const previousCwd = process.cwd()
    const previousPath = process.env.PATH
    const previousMarker = process.env.NI_PATH_TEST_MARKER
    let selectedBinary: string | undefined

    try {
      await Promise.all([
        fs.mkdir(localBin, { recursive: true }),
        fs.mkdir(systemBin, { recursive: true }),
      ])
      await Promise.all([
        writeFixtureCommand(localBin, 'local'),
        writeFixtureCommand(systemBin, 'system'),
      ])

      process.chdir(fixture)
      process.env.PATH = `${systemBin}${path.delimiter}${previousPath ?? ''}`
      process.env.NI_PATH_TEST_MARKER = marker

      await runCli(
        () => ({ command: 'fixture-pm', args: [] }),
        { cwd: fixture, detectVolta: false, programmatic: true },
      )
      selectedBinary = (await fs.readFile(marker, 'utf8')).trim()
    }
    finally {
      process.chdir(previousCwd)
      if (previousPath === undefined)
        delete process.env.PATH
      else
        process.env.PATH = previousPath
      if (previousMarker === undefined)
        delete process.env.NI_PATH_TEST_MARKER
      else
        process.env.NI_PATH_TEST_MARKER = previousMarker
      await fs.rm(fixture, { force: true, recursive: true })
    }

    expect(selectedBinary).toBe('system')
    expect(process.cwd()).toBe(previousCwd)
    expect(process.env.PATH).toBe(previousPath)
    expect(process.env.NI_PATH_TEST_MARKER).toBe(previousMarker)
    await expect(fs.access(fixture)).rejects.toThrow()
  })

  it('merges inputs and environment prioritizing inputs', async () => {
    vi.stubEnv('NI_AUTO_INSTALL', 'true')
    await runCli(mocks.baseRunFnSpy, { autoInstall: false, programmatic: true })
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: false, programmatic: true, cwd: expect.any(String) })
  })

  it('parses --programmatic flag from args', async () => {
    await runCli(mocks.baseRunFnSpy, { args: ['--programmatic'] })
    expect(mocks.detectSpy).toHaveBeenCalledWith(expect.objectContaining({ autoInstall: false, programmatic: true, cwd: expect.any(String) }))
  })

  it('removes --programmatic from args before passing to runner', async () => {
    await runCli(mocks.baseRunFnSpy, { args: ['--programmatic', 'foo'] })
    expect(mocks.baseRunFnSpy).toHaveBeenCalledWith('npm', ['foo'], { programmatic: true, hasLock: true, cwd: expect.any(String) })
  })

  describe('onBeforeCommand', () => {
    it('skips running the command when exit() is called', async () => {
      await runCli(mocks.baseRunFnSpy, { onBeforeCommand: (_args, ctx) => ctx.exit() })
      expect(mocks.baseRunFnSpy).not.toHaveBeenCalled()
      // https://github.com/antfu-collective/ni/issues/308
      expect(mocks.detectSpy).not.toHaveBeenCalled()
    })

    it('continues to run the command when exit() is not called', async () => {
      await runCli(mocks.baseRunFnSpy, { onBeforeCommand: () => Promise.resolve() })
      expect(mocks.baseRunFnSpy).toHaveBeenCalledOnce()
    })
  })
})
