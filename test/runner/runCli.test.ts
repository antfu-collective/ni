import type { Runner } from '../../src'
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
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: false, cwd: expect.any(String) })
  })

  it('detects environment options', async () => {
    vi.stubEnv('NI_AUTO_INSTALL', 'true')
    await runCli(mocks.baseRunFnSpy)
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: true, cwd: expect.any(String) })
  })

  it('accept options as input', async () => {
    await runCli(mocks.baseRunFnSpy, { autoInstall: true, programmatic: true })
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: true, programmatic: true, cwd: expect.any(String) })
  })

  it('merges inputs and environment prioritizing inputs', async () => {
    vi.stubEnv('NI_AUTO_INSTALL', 'true')
    await runCli(mocks.baseRunFnSpy, { autoInstall: false, programmatic: true })
    expect(mocks.detectSpy).toHaveBeenCalledWith({ autoInstall: false, programmatic: true, cwd: expect.any(String) })
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
