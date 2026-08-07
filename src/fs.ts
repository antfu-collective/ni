import type { RunnerContext } from './runner'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export function findClosestPackageJson(cwd: string): string | null {
  let dir = path.resolve(cwd)
  while (true) {
    const filePath = path.join(dir, 'package.json')
    if (fs.existsSync(filePath))
      return filePath
    const parent = path.dirname(dir)
    if (parent === dir)
      return null
    dir = parent
  }
}

function readPackageJSON(packageJsonPath: string, ctx?: RunnerContext): any {
  try {
    const raw = fs.readFileSync(packageJsonPath, 'utf-8')
    const data = JSON.parse(raw)
    return data
  }
  catch (e) {
    if (!ctx?.programmatic) {
      console.warn('Failed to parse package.json')
      process.exit(1)
    }

    throw e
  }
}

export function getPackageJSON(ctx?: RunnerContext): any {
  const cwd = ctx?.cwd ?? process.cwd()
  const packageJsonPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(packageJsonPath))
    return undefined
  return readPackageJSON(packageJsonPath, ctx)
}

export function getClosestPackageJSON(ctx?: RunnerContext): any {
  const cwd = ctx?.cwd ?? process.cwd()
  const packageJsonPath = findClosestPackageJson(cwd)
  if (!packageJsonPath)
    return undefined
  return readPackageJSON(packageJsonPath, ctx)
}
