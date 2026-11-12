import type { Storage } from '../../src/storage'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getTerminalId } from '../../src/utils'

let dir: string
let storage: typeof import('../../src/storage')

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ni-storage-'))
  // `CLI_TEMP_DIR` is derived from `os.tmpdir()`, so pointing the temp dir at
  // the test's own directory keeps the real storage untouched
  vi.stubEnv('TMPDIR', dir)
  vi.stubEnv('TMP', dir)
  vi.stubEnv('TEMP', dir)
  vi.resetModules()
  storage = await import('../../src/storage')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await fs.rm(dir, { recursive: true, force: true })
})

function storageDir() {
  return path.join(dir, 'antfu-ni')
}

describe('getTerminalId', () => {
  it('is stable within a process', () => {
    expect(getTerminalId()).toBe(getTerminalId())
  })

  it('can be used as a file name', () => {
    const id = getTerminalId()

    expect(id).toBeTruthy()
    expect(id).toBe(path.basename(id))
  })
})

describe('getStorageKey', () => {
  it('shares a single file in shared mode', () => {
    expect(storage.getStorageKey('shared')).toBeUndefined()
  })

  it('keys the file by terminal in terminal mode', () => {
    expect(storage.getStorageKey('terminal')).toBe(getTerminalId())
  })

  it('has no key in off mode', () => {
    expect(storage.getStorageKey('off')).toBeUndefined()
  })
})

describe('load / dump', () => {
  it('returns an empty state when nothing was written yet', async () => {
    expect(await storage.load()).toEqual({})
  })

  it('round-trips the shared file', async () => {
    const state: Storage = { lastRunCommand: 'dev' }

    await storage.dump(state)

    expect(await storage.load()).toEqual({ lastRunCommand: 'dev' })
    await expect(fs.stat(path.join(storageDir(), '_storage.json'))).resolves.toBeDefined()
  })

  it('writes one file per key', async () => {
    await storage.dump({ lastRunCommand: 'dev' }, 'ttys008')
    await storage.dump({ lastRunCommand: 'build' }, 'ttys010')

    expect(await storage.load('ttys008')).toEqual({ lastRunCommand: 'dev' })
    expect(await storage.load('ttys010')).toEqual({ lastRunCommand: 'build' })
    // Neither key may leak into the other, nor into the shared file
    expect(await storage.load('ttys011')).toEqual({})
    expect(await storage.load()).toEqual({})
    await expect(fs.readdir(storageDir())).resolves.toEqual(
      expect.arrayContaining(['_storage.ttys008.json', '_storage.ttys010.json']),
    )
  })

  it('does not let a corrupt file break the command', async () => {
    await fs.mkdir(storageDir(), { recursive: true })
    await fs.writeFile(path.join(storageDir(), '_storage.json'), 'not json')

    expect(await storage.load()).toEqual({})
  })
})
