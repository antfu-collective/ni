import type { Agent } from 'package-manager-detector'
import type { ExtendedResolvedCommand, RunnerContext } from '../runner'
import type { DepType } from './package-json'
import type { CatalogConfig, CatalogProvider } from './types'
import path from 'node:path'
import process from 'node:process'
import c from 'ansis'
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

async function resolveCatalogForPackage(
  provider: CatalogProvider,
  config: CatalogConfig,
  pkgName: string,
  programmatic?: boolean,
): Promise<{ catalogName: string | undefined, version?: string }> {
  // Check if already in a catalog
  const existing = provider.findPackage(config, pkgName)
  if (existing) {
    return { catalogName: existing.name }
  }

  // Prompt user to select catalog
  const { catalogName } = await promptSelectCatalog(config, pkgName, programmatic)
  if (!catalogName)
    return { catalogName: undefined }

  // Fetch latest version for new catalog entry
  const version = await resolveVersion(pkgName)
  return { catalogName, version }
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

  for (const pkg of packages) {
    const result = await resolveCatalogForPackage(provider, config, pkg, ctx?.programmatic)

    if (result.catalogName) {
      // Add to catalog file if it's a new entry
      if (result.version) {
        await provider.addPackage(config, result.catalogName, pkg, result.version)
        if (!ctx?.programmatic) {
          // eslint-disable-next-line no-console
          console.log(`${c.green('+')} ${c.cyan(pkg)} ${c.dim(`→ ${result.catalogName} catalog (${result.version})`)}`)
        }
      }
      else if (!ctx?.programmatic) {
        const existingCatalog = provider.findPackage(config, pkg)
        // eslint-disable-next-line no-console
        console.log(`${c.green('✓')} ${c.cyan(pkg)} ${c.dim(`→ found in ${existingCatalog!.name} catalog`)}`)
      }
      catalogEntries.push({ name: pkg, catalogRef: getCatalogRef(result.catalogName) })
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
      console.error(c.red('✗ No package.json found'))
      process.exit(1)
    }
    throw new Error('No package.json found')
  }

  // Update package.json with catalog refs
  updatePackageJsonCatalogRefs(pkgJsonPath, catalogEntries, depType)

  // If some packages were skipped, add them normally alongside install
  if (skippedPackages.length > 0) {
    return getCommand(agent, 'add', [...skippedPackages, ...flags])
  }

  // All packages handled via catalogs, just run install
  return getCommand(agent, 'install', [])
}
