import fs from 'node:fs'
import os from 'node:os'
import { join } from 'node:path'
import { afterAll, expect, it } from 'vitest'
import { findConfigFiles } from '../../src/fs'

// Built outside the repository so that a real `.nirc` in the developer's home
// directory cannot be picked up by the upward traversal.
const root = fs.mkdtempSync(join(os.tmpdir(), 'ni-nirc-'))
const home = join(root, 'home')
const project = join(root, 'project')
const nested = join(project, 'nested')

fs.mkdirSync(home)
fs.mkdirSync(nested, { recursive: true })
fs.writeFileSync(join(home, '.nirc'), 'globalAgent=pnpm\nuseSfw=true\n')
fs.writeFileSync(join(project, '.nirc'), 'defaultAgent=bun\n')

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

it('returns the nearest config file first', () => {
  const found = findConfigFiles(nested, '.nirc', home)

  expect(found).toEqual([
    join(project, '.nirc'),
    join(home, '.nirc'),
  ])
})

it('returns an empty list when nothing is found', () => {
  const found = findConfigFiles(nested, '.nonexistentrc', home)

  expect(found).toEqual([])
})

it('does not list the home config twice when it is also an ancestor', () => {
  const found = findConfigFiles(nested, '.nirc', project)

  expect(found).toEqual([join(project, '.nirc')])
})
