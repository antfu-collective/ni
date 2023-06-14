import { resolve } from 'node:path'
import fs from 'node:fs'
import c from 'kleur'
import type { RunnerContext } from './runner'

export function getPackageJSON(ctx?: RunnerContext): any {
  const path = getPath(ctx)

  if (fs.existsSync(path)) {
    try {
      const raw = fs.readFileSync(path, 'utf-8')
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
}

function getPath(ctx?: RunnerContext): string {
  const cwd = ctx?.cwd ?? process.cwd()
  const path = resolve(cwd, 'package.json')
  return path
}

export function isExistsPackageJSON(): boolean {
  const path = getPath()

  if (!fs.existsSync(path)) {
    /* eslint-disable no-console */
    console.log(c.red('The package.json file does not exist'))
    process.exit(1)
  }
  return true
}
