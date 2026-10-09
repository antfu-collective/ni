import fs from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { x } from 'tinyexec'
import { expect, it } from 'vitest'

it('completes the scripts of the package above `-C`', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ni-completion-'))
  const nested = path.join(root, 'src', 'components')
  await fs.mkdir(nested, { recursive: true })
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { hello: 'echo hi', world: 'echo w' } }))
  await fs.writeFile(path.join(root, 'package-lock.json'), '{}')

  const nr = path.join(__dirname, '../../src/commands/nr.ts')
  const { stdout } = await x('tsx', [nr, '-C', nested, '--completion', ''], { throwOnError: true })

  expect(stdout.trim()).toBe('hello\nworld')
})
