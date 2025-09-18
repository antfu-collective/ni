import type { Choice } from '@posva/prompts'
import type { RunnerContext } from './runner'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import prompts from '@posva/prompts'
import { byLengthAsc, Fzf } from 'fzf'
import { globSync } from 'tinyglobby'
import { getPackageJSON } from './fs'

export const IGNORE_PATHS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/public/**',
  '**/fixture/**',
  '**/fixtures/**',
]

export function findPackages(ctx?: RunnerContext) {
  const { cwd = process.cwd() } = ctx ?? {}
  const packagePath = resolve(cwd, 'package.json')
  if (!existsSync(packagePath))
    return []

  const pkgs = globSync('**/package.json', {
    ignore: IGNORE_PATHS,
    cwd,
    onlyFiles: true,
    dot: false,
    expandDirectories: false,
  })

  if (pkgs.length <= 1)
    return [packagePath]
  return pkgs
}

export async function promptSelectPackage(ctx?: RunnerContext, command?: string): Promise<RunnerContext | undefined> {
  const cwd = ctx?.cwd ?? process.cwd()
  const packagePaths = findPackages(ctx)
  if (packagePaths.length <= 1) {
    return ctx
  }

  const blank = ' '.repeat(process.stdout?.columns || 80)
  // Prompt the user to select a package
  let choices: (Choice & { scripts: Record<string, string> })[] = packagePaths.map((item) => {
    const filePath = resolve(cwd, item)
    const dir = dirname(filePath)
    const pkg = getPackageJSON({ ...ctx, cwd: dir, programmatic: true })

    return {
      title: pkg.name ?? item,
      value: dir,
      description: `${pkg.description ?? filePath}${blank}`,
      scripts: pkg.scripts,
    }
  })

  // Filter packages that have the command
  if (command) {
    choices = choices.filter(c => c.scripts?.[command])
  }
  if (!choices.length) {
    return ctx
  }
  if (choices.length === 1) {
    return { ...ctx, cwd: choices[0].value }
  }

  const fzf = new Fzf(choices, {
    selector: item => `${item.title} ${item.description}`,
    casing: 'case-insensitive',
    tiebreakers: [byLengthAsc],
  })

  let res: string
  try {
    const { pkg } = await prompts({
      name: 'pkg',
      message: 'select a package',
      type: 'autocomplete',
      choices,
      async suggest(input: string, choices: Choice[]) {
        if (!input)
          return choices
        const results = fzf.find(input)
        return results.map(r => choices.find(c => c.value === r.item.value))
      },
    })
    if (!pkg)
      throw new Error('No package selected')
    res = pkg
  }
  catch (error) {
    if (!ctx?.programmatic)
      process.exit(1)
    throw error
  }

  return { ...ctx, cwd: res }
}
