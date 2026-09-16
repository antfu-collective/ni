import type { Agent } from 'package-manager-detector'
import type { ExtendedResolvedCommand, RunnerContext } from '../runner'
import type { DepType } from './package-json'
import type { PreviousSelection } from './prompt'
import type { PackageSpec } from './spec'
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
import { getRangePrefix } from './range-prefix'
import { isVerbatimSpec, parsePackageSpec } from './spec'
import { getCatalogRef } from './types'

function splitPackagesAndFlags(args: string[]): { packages: PackageSpec[], flags: string[] } {
  const packages: PackageSpec[] = []
  const flags: string[] = []
  for (const arg of args) {
    if (arg.startsWith('-'))
      flags.push(arg)
    else
      packages.push(parsePackageSpec(arg))
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

async function resolveVersion(pkg: PackageSpec, rangePrefix: string): Promise<string> {
  // A range or exact pin the user typed is what they asked for: keep it as-is
  // instead of overriding it with the latest published version.
  if (pkg.spec && isVerbatimSpec(pkg.spec))
    return pkg.spec

  // Otherwise resolve the whole specifier, so dist-tags like `@latest` or
  // `@next` still pick the version they point at.
  const meta = await getLatestVersion(pkg.raw)
  return `${rangePrefix}${meta.version}`
}

// Whether any package after `currentIndex` is not yet in a catalog and would
// therefore still trigger a prompt — used to decide if the "apply to all
// remaining" shortcut is worth offering.
function hasRemainingNewPackages(
  provider: CatalogProvider,
  config: CatalogConfig,
  packages: PackageSpec[],
  currentIndex: number,
): boolean {
  for (let i = currentIndex + 1; i < packages.length; i++) {
    if (!provider.findPackage(config, packages[i].name))
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
  const rangePrefix = getRangePrefix(agent, cwd)
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
    const existing = provider.findPackage(config, pkg.name)
    if (existing) {
      if (!ctx?.programmatic) {
        // The catalog version wins over anything the user typed, since it is
        // shared with every other package referencing this catalog.
        const cataloged = existing.packages[pkg.name]
        const note = pkg.spec && pkg.spec !== cataloged
          ? `→ found in ${existing.name} catalog (${cataloged}, ignoring ${pkg.spec})`
          : `→ found in ${existing.name} catalog`
        // eslint-disable-next-line no-console
        console.log(`${styleText('green', '✓')} ${styleText('cyan', pkg.raw)} ${styleText('dim', note)}`)
      }
      catalogEntries.push({ name: pkg.name, catalogRef: getCatalogRef(existing.name) })
      continue
    }

    // `existing` mode: catalogs are only reused, never extended. Anything not
    // already cataloged is installed normally.
    if (catalogEnabled === 'existing') {
      skippedPackages.push(pkg.raw)
      continue
    }

    let catalogName: string | undefined
    if (applyToRest) {
      catalogName = applyToRest.catalogName
    }
    else {
      const selection = await promptSelectCatalog(config, pkg.name, {
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
      const version = await resolveVersion(pkg, rangePrefix)
      await provider.addPackage(config, catalogName, pkg.name, version)
      if (!ctx?.programmatic) {
        // eslint-disable-next-line no-console
        console.log(`${styleText('green', '+')} ${styleText('cyan', pkg.name)} ${styleText('dim', `→ ${catalogName} catalog (${version})`)}`)
      }
      catalogEntries.push({ name: pkg.name, catalogRef: getCatalogRef(catalogName) })
    }
    else {
      // Not cataloged: hand the untouched argument back to the agent.
      skippedPackages.push(pkg.raw)
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
