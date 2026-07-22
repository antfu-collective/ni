import type { RunnerContext } from '.'
import { getPackageJSON } from './fs'
import { promptSelectPackage } from './monorepo'

export interface PackageScript {
  key: string
  cmd: string
  description: string
}

export async function readWorkspaceScripts(ctx: RunnerContext | undefined, args: string[]): Promise<PackageScript[]> {
  const index = args.findIndex(i => i === '-p')
  let command: string = ''
  if (index !== -1) {
    command = args[index + 1]
  }

  const context = await promptSelectPackage(ctx, command)
  // Change cwd to the selected package
  if (ctx && context?.cwd) {
    ctx.cwd = context.cwd
  }
  const scripts = readPackageScripts(context)
  const cmdIndex = scripts.findIndex(i => i.key === command)
  if (command && cmdIndex !== -1) {
    return [scripts[cmdIndex]]
  }
  return scripts
}

export function readPackageScripts(ctx: RunnerContext | undefined): PackageScript[] {
  // support https://www.npmjs.com/package/npm-scripts-info conventions
  const pkg = getPackageJSON(ctx)
  const rawScripts = pkg.scripts || {}
  const scriptsInfo = pkg['scripts-info'] || {}

  const scripts = Object.entries(rawScripts)
    .filter(i => !i[0].startsWith('?'))
    .map(([key, cmd]) => ({
      key,
      cmd,
      // when `scripts-info` provides a description, show it alongside the
      // actual command on a second line, so nothing gets hidden
      description: scriptsInfo[key]
        ? `${scriptsInfo[key]}\n${cmd}`
        : (rawScripts[`?${key}`] || cmd),
    }))

  if (scripts.length === 0 && !ctx?.programmatic) {
    console.warn('No scripts found in package.json')
  }

  return scripts as PackageScript[]
}
