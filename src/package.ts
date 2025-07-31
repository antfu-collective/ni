import type { RunnerContext } from '.'
import { getPackageJSON } from './fs'

export function readPackageScripts(ctx: RunnerContext | undefined) {
  // support https://www.npmjs.com/package/npm-scripts-info conventions
  const pkg = getPackageJSON(ctx)
  const rawScripts = pkg.scripts || {}
  const scriptsInfo = pkg['scripts-info'] || {}

  const scripts = Object.entries(rawScripts)
    .filter(i => !i[0].startsWith('?'))
    .map(([key, cmd]) => ({
      key,
      cmd,
      description: scriptsInfo[key] || rawScripts[`?${key}`] || cmd,
    }))

  if (scripts.length === 0 && !ctx?.programmatic) {
    console.warn('No scripts found in package.json')
  }

  return scripts
}
