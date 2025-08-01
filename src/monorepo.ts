import type { RunnerContext } from './runner'
import fs from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { glob } from 'glob'
import { parse } from 'yaml'

export async function globPackages(path: string) {
  const paths = await glob(`${path}/**/package.json`, {
    ignore: '**/node_modules/**',
  })
  return paths.map(path => path.replace('/package.json', ''))
}

export function resolvePnpmPackages(path: string): string[] {
  const workspace = resolve(path, 'pnpm-workspace.yaml')
  if (!fs.existsSync(workspace)) {
    return []
  }

  const yaml = fs.readFileSync(workspace, 'utf-8')
  const data = parse(yaml)

  if ('packages' in data) {
    return data.packages
  }

  return []
}

export async function findPackages(ctx: RunnerContext | undefined) {
  const paths = resolvePnpmPackages(ctx?.cwd ?? process.cwd())
  const packages: string[] = []
  for (const p of paths) {
    const pkg = await globPackages(p)
    packages.push(...pkg)
  }

  return packages
}
