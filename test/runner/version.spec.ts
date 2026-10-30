import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseNa, run } from '../../src'

describe('--version with a broken global agent (#271)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prints ni/node and marks the broken agent unavailable instead of throwing', async () => {
    const fixture = await fs.mkdtemp(path.join(tmpdir(), 'ni-version-'))
    const systemBin = path.join(fixture, 'bin')
    await fs.mkdir(systemBin)

    // Fake npm that mimics corepack-enabled npm failing with EACCES
    const npmPath = path.join(systemBin, process.platform === 'win32' ? 'npm.cmd' : 'npm')
    const npmBody = process.platform === 'win32'
      ? '@echo Internal Error: EACCES: permission denied>&2\r\n@exit /b 1\r\n'
      : '#!/bin/sh\necho "Internal Error: EACCES: permission denied" >&2\nexit 1\n'
    await fs.writeFile(npmPath, npmBody)
    if (process.platform !== 'win32')
      await fs.chmod(npmPath, 0o755)

    // Empty cwd → no lockfile agent; force global agent to npm
    const cwd = path.join(fixture, 'cwd')
    await fs.mkdir(cwd)

    const previousPath = process.env.PATH
    const logs: string[] = []
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    })

    try {
      process.env.PATH = `${systemBin}${path.delimiter}${previousPath ?? ''}`
      vi.stubEnv('NI_GLOBAL_AGENT', 'npm')

      await expect(run(parseNa, ['--version'], { cwd, programmatic: true })).resolves.toBeUndefined()

      expect(logs.some(l => l.includes('@antfu/ni'))).toBe(true)
      expect(logs.some(l => l.startsWith('node'))).toBe(true)
      expect(logs.some(l => l.includes('no lock file'))).toBe(true)
      expect(logs.some(l => l.includes('npm -g') && l.includes('unavailable'))).toBe(true)
    }
    finally {
      logSpy.mockRestore()
      process.env.PATH = previousPath
    }
  })
})
