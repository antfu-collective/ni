import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseNi, runCli } from '../../src'

const mocks = vi.hoisted(() => ({
  cmdExistsSpy: vi.fn(),
  execSpy: vi.fn(),
}))

vi.mock('../../src/utils', async (importOriginal) => {
  const mod = await importOriginal() as any
  return {
    ...mod,
    cmdExists: mocks.cmdExistsSpy,
  }
})

vi.mock('tinyexec', () => ({
  x: mocks.execSpy,
}))

describe('sfw', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('wraps command with sfw when enabled and installed', async () => {
    vi.stubEnv('NI_USE_SFW', 'true')
    mocks.cmdExistsSpy.mockImplementation(() => true)
    mocks.execSpy.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

    await runCli(parseNi, {
      programmatic: true,
      args: ['axios'],
      detectVolta: false,
    })

    expect(mocks.execSpy).toHaveBeenCalledWith(
      'sfw',
      ['pnpm', 'add', 'axios'],
      expect.objectContaining({
        nodeOptions: expect.objectContaining({
          stdio: 'inherit',
        }),
      }),
    )
  })

  it('throws error when sfw is not installed', async () => {
    vi.stubEnv('NI_USE_SFW', 'true')
    mocks.cmdExistsSpy.mockImplementation(() => false)

    await expect(
      runCli(parseNi, {
        programmatic: true,
        args: ['axios'],
        detectVolta: false,
      }),
    ).rejects.toThrow(/sfw is enabled but not installed/)

    expect(mocks.execSpy).not.toHaveBeenCalled()
  })

  it('wraps command with sfw and volta', async () => {
    vi.stubEnv('NI_USE_SFW', 'true')
    mocks.cmdExistsSpy.mockImplementation(() => true)
    mocks.execSpy.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

    await runCli(parseNi, {
      programmatic: true,
      args: ['axios'],
      detectVolta: true,
    })

    expect(mocks.execSpy).toHaveBeenCalledWith(
      'volta',
      ['run', 'sfw', 'pnpm', 'add', 'axios'],
      expect.objectContaining({
        nodeOptions: expect.objectContaining({
          stdio: 'inherit',
        }),
      }),
    )
  })
})
