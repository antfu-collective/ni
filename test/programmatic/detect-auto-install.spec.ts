import { x } from 'tinyexec'
import { expect, it, vi } from 'vitest'
import { detect } from '../../src/detect'

const detector = vi.hoisted(() => vi.fn())

vi.mock('package-manager-detector', () => ({
  detect: detector,
}))

vi.mock('tinyexec', () => ({
  x: vi.fn(async () => ({})),
}))

vi.mock('../../src/utils', () => ({
  cmdExists: vi.fn(() => false),
  terminalLink: vi.fn((text: string) => text),
}))

it('installs aube from its scoped npm package', async () => {
  detector.mockResolvedValueOnce({
    name: 'aube',
    agent: 'aube',
    version: '1.2.3',
  })

  await expect(detect({ autoInstall: true, cwd: __dirname })).resolves.toBe('aube')

  expect(x).toHaveBeenCalledWith(
    'npm',
    ['i', '-g', '@endevco/aube@1.2.3'],
    expect.objectContaining({ throwOnError: true }),
  )
})

it('installs nub from its scoped npm package', async () => {
  detector.mockResolvedValueOnce({
    name: 'nub',
    agent: 'nub',
    version: '0.6.0',
  })

  await expect(detect({ autoInstall: true, cwd: __dirname })).resolves.toBe('nub')

  expect(x).toHaveBeenCalledWith(
    'npm',
    ['i', '-g', '@nubjs/nub@0.6.0'],
    expect.objectContaining({ throwOnError: true }),
  )
})
