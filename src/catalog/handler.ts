import type { Agent } from 'package-manager-detector'
import type { ExtendedResolvedCommand, RunnerContext } from '../runner'
import type { DepType } from './package-json'
import type { PreviousSelection } from './prompt'
import type { CatalogConfig, CatalogProvider } from './types'
import path from 'node:path'
import process from 'node:process'
import { styleText } from 'node:util'
import { getLatestVersion } from 'fast-npm-meta'
import { getCatalog } from '../config'
import { getCommand } from '../parse'
import { getCatalogProvider } from './detect'
import { findClosestPackageJson, updatePackageJsonCatalogRefs } from './package-json'
import { promptSelectCatalog } from './prompt'
import { getCatalogRef } from './types'

function splitPackagesAndFlags(args: string[]): { packages: string[], flags: string[] } {
  const packages: string[] = []
  const flags: string[] = []
  for (const arg of args) {
    if (arg.startsWith('-'))
      flags.push(arg)
    else
      packages.push(arg)
  }
  return { packages, flags }
}

function getDepType(flags: string[]): DepType {
  if (flags.includes('-D') || flags.includes('-d'))
    return 'devDependencies'
  if (flags.includes('--save-peer'))
    return 'peerDependencies'
  return 'dependencies'
}

async function resolveVersion(pkgName: string): Promise<string> {
  const meta = await getLatestVersion(pkgName)
  return `^${meta.version}`
}

// Whether any package after `currentIndex` is not yet in a catalog and would
// therefore still trigger a prompt — used to decide if the "apply to all
// remaining" shortcut is worth offering.
function hasRemainingNewPackages(
  provider: CatalogProvider,
  config: CatalogConfig,
  packages: string[],
  currentIndex: number,
): boolean {
  for (let i = currentIndex + 1; i < packages.length; i++) {
    if (!provider.findPackage(config, packages[i]))
      return true
  }
  return false
}

export async function handleCatalogInstall(
  agent: Agent,
  args: string[],
  ctx?: RunnerContext,
): Promise<ExtendedResolvedCommand | undefined> {
  const catalogEnabled = await getCatalog()
  if (!catalogEnabled)
    return undefined

  const provider = getCatalogProvider(agent)
  if (!provider)
    return undefined

  // Check for workspace flag
  const hasWorkspaceFlag = args.includes('-w') || args.includes('--workspace')
  const cleanArgs = args.filter(a => a !== '-w' && a !== '--workspace')

  const { packages, flags } = splitPackagesAndFlags(cleanArgs)

  // No packages to add (bare install, frozen, etc.)
  if (packages.length === 0)
    return undefined

  const cwd = ctx?.cwd ?? process.cwd()
  const config = await provider.detect(cwd)
  if (!config)
    return undefined

  const depType = getDepType(flags)
  const catalogEntries: { name: string, catalogRef: string }[] = []
  const skippedPackages: string[] = []

  // The last catalog chosen through a prompt, powering the "same as previous"
  // shortcut for subsequent packages.
  let previous: PreviousSelection | undefined
  // Set once the user picks "apply to all remaining": every subsequent new
  // package reuses this catalog without prompting.
  let applyToRest: PreviousSelection | undefined

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i]

    // Already in a catalog: reuse it, never prompt.
    const existing = provider.findPackage(config, pkg)
    if (existing) {
      if (!ctx?.programmatic) {
        // eslint-disable-next-line no-console
        console.log(`${styleText('green', '✓')} ${styleText('cyan', pkg)} ${styleText('dim', `→ found in ${existing.name} catalog`)}`)
      }
      catalogEntries.push({ name: pkg, catalogRef: getCatalogRef(existing.name) })
      continue
    }

    let catalogName: string | undefined
    if (applyToRest) {
      catalogName = applyToRest.catalogName
    }
    else {
      const selection = await promptSelectCatalog(config, pkg, {
        programmatic: ctx?.programmatic,
        previous,
        hasRemaining: hasRemainingNewPackages(provider, config, packages, i),
      })
      catalogName = selection.catalogName
      if (!ctx?.programmatic) {
        previous = { catalogName }
        if (selection.applyToRest)
          applyToRest = { catalogName }
      }
    }

    if (catalogName) {
      // New catalog entry: record the resolved version.
      const version = await resolveVersion(pkg)
      await provider.addPackage(config, catalogName, pkg, version)
      if (!ctx?.programmatic) {
        // eslint-disable-next-line no-console
        console.log(`${styleText('green', '+')} ${styleText('cyan', pkg)} ${styleText('dim', `→ ${catalogName} catalog (${version})`)}`)
      }
      catalogEntries.push({ name: pkg, catalogRef: getCatalogRef(catalogName) })
    }
    else {
      skippedPackages.push(pkg)
    }
  }

  if (catalogEntries.length === 0)
    return undefined

  // Determine target package.json
  let pkgJsonPath: string | null
  if (hasWorkspaceFlag) {
    pkgJsonPath = path.join(path.dirname(config.filePath), 'package.json')
  }
  else {
    pkgJsonPath = findClosestPackageJson(cwd)
  }

  if (!pkgJsonPath) {
    if (!ctx?.programmatic) {
      console.error(styleText('red', '✗ No package.json found'))
      process.exit(1)
    }
    throw new Error('No package.json found')
  }

  // Update package.json with catalog refs
  updatePackageJsonCatalogRefs(pkgJsonPath, catalogEntries, depType)

  // If some packages were skipped, add them normally alongside install
  if (skippedPackages.length > 0) {
    // bun uses `-d` instead of `-D`, #90
    const addFlags = agent === 'bun' ? flags.map(f => f === '-D' ? '-d' : f) : flags
    return getCommand(agent, 'add', [...skippedPackages, ...addFlags])
  }

  // All packages handled via catalogs, just run install
  return getCommand(agent, 'install', [])
}
