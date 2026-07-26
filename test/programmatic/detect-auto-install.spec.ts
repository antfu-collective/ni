import { x } from 'tinyexec'
import { expect, it, vi } from 'vitest'
import { detect } from '../../src/detect'

vi.mock('package-manager-detector', () => ({
  detect: vi.fn(async () => ({
    name: 'aube',
    agent: 'aube',
    version: '1.2.3',
  })),
}))

vi.mock('tinyexec', () => ({
  x: vi.fn(async () => ({})),
}))

vi.mock('../../src/utils', () => ({
  cmdExists: vi.fn(() => false),
  terminalLink: vi.fn((text: string) => text),
}))

it('installs aube from its scoped npm package', async () => {
  await expect(detect({ autoInstall: true, cwd: __dirname })).resolves.toBe('aube')

  expect(x).toHaveBeenCalledWith(
    'npm',
    ['i', '-g', '@endevco/aube@1.2.3'],
    expect.objectContaining({ throwOnError: true }),
  )
})
