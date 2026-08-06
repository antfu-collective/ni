import type { CatalogConfig, CatalogInfo, CatalogProvider } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { detectIndent } from './package-json'

interface BunWorkspacesField {
  packages?: string[]
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
}

interface BunPackageJson {
  workspaces?: BunWorkspacesField | string[]
  catalog?: Record<string, string>
  catalogs?: Record<string, Record<string, string>>
  [key: string]: unknown
}

function getWorkspacesField(json: BunPackageJson): BunWorkspacesField | undefined {
  return json.workspaces != null && !Array.isArray(json.workspaces)
    ? json.workspaces
    : undefined
}

// Bun catalogs only apply within a workspace root, so walk up looking for the
// nearest package.json that declares a `workspaces` field (array or object).
function findBunWorkspaceRoot(cwd: string): string | null {
  let dir = path.resolve(cwd)
  while (true) {
    const filePath = path.join(dir, 'package.json')
    if (fs.existsSync(filePath)) {
      try {
        const json: BunPackageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        if (json.workspaces != null)
          return filePath
      }
      catch {
        // Ignore invalid package.json and keep walking up.
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir)
      return null
    dir = parent
  }
}

// Bun allows `catalog`/`catalogs` either nested under `workspaces` or at the
// top level of package.json. Prefer the nested location when both are absent
// or when only the nested one is present, matching Bun's own docs.
function readCatalogFields(json: BunPackageJson): {
  defaultCatalog: Record<string, string> | undefined
  namedCatalogs: Record<string, Record<string, string>> | undefined
  nested: boolean
} {
  const workspaces = getWorkspacesField(json)
  if (workspaces?.catalog != null || workspaces?.catalogs != null) {
    return {
      defaultCatalog: workspaces.catalog,
      namedCatalogs: workspaces.catalogs,
      nested: true,
    }
  }

  return {
    defaultCatalog: json.catalog,
    namedCatalogs: json.catalogs,
    nested: false,
  }
}

export const bunCatalogProvider: CatalogProvider = {
  async detect(cwd: string): Promise<CatalogConfig | null> {
    const filePath = findBunWorkspaceRoot(cwd)
    if (!filePath)
      return null

    const content = fs.readFileSync(filePath, 'utf-8')
    const json: BunPackageJson = JSON.parse(content)
    const { defaultCatalog, namedCatalogs } = readCatalogFields(json)

    const catalogs: CatalogInfo[] = []
    const hasDefaultCatalog = defaultCatalog != null && Object.keys(defaultCatalog).length > 0
    const hasNamedCatalogs = namedCatalogs != null && Object.keys(namedCatalogs).length > 0

    if (!hasDefaultCatalog && !hasNamedCatalogs)
      return null

    if (hasDefaultCatalog) {
      catalogs.push({
        name: 'default',
        packages: defaultCatalog!,
      })
    }

    if (hasNamedCatalogs) {
      for (const [name, packages] of Object.entries(namedCatalogs!)) {
        catalogs.push({ name, packages })
      }
    }

    return {
      filePath,
      catalogs,
      hasDefaultCatalog,
      hasNamedCatalogs,
    }
  },

  findPackage(config: CatalogConfig, pkgName: string): CatalogInfo | undefined {
    return config.catalogs.find(c => pkgName in c.packages)
  },

  async addPackage(config: CatalogConfig, catalogName: string, pkgName: string, version: string): Promise<void> {
    const content = fs.readFileSync(config.filePath, 'utf-8')
    const indent = detectIndent(content)
    const json: BunPackageJson = JSON.parse(content)

    const workspaces = getWorkspacesField(json)
    const nested = !!(workspaces && (workspaces.catalog != null || workspaces.catalogs != null))
    const target = nested ? workspaces! : json

    if (catalogName === 'default') {
      target.catalog = { ...(target.catalog ?? {}), [pkgName]: version }
    }
    else {
      target.catalogs = target.catalogs ?? {}
      target.catalogs[catalogName] = { ...(target.catalogs[catalogName] ?? {}), [pkgName]: version }
    }

    fs.writeFileSync(config.filePath, `${JSON.stringify(json, null, indent)}\n`)

    // Update the in-memory config
    const existing = config.catalogs.find(c => c.name === catalogName)
    if (existing) {
      existing.packages[pkgName] = version
    }
    else {
      config.catalogs.push({ name: catalogName, packages: { [pkgName]: version } })
    }
  },
}
