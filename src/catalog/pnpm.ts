import type { CatalogConfig, CatalogInfo, CatalogProvider } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { parsePnpmWorkspaceYaml } from 'pnpm-workspace-yaml'

function findPnpmWorkspaceYaml(cwd: string): string | null {
  let dir = path.resolve(cwd)
  while (true) {
    const filePath = path.join(dir, 'pnpm-workspace.yaml')
    if (fs.existsSync(filePath))
      return filePath
    const parent = path.dirname(dir)
    if (parent === dir)
      return null
    dir = parent
  }
}

export const pnpmCatalogProvider: CatalogProvider = {
  async detect(cwd: string): Promise<CatalogConfig | null> {
    const filePath = findPnpmWorkspaceYaml(cwd)
    if (!filePath)
      return null

    const content = fs.readFileSync(filePath, 'utf-8')
    const workspace = parsePnpmWorkspaceYaml(content)
    const json = workspace.toJSON()

    const catalogs: CatalogInfo[] = []
    const hasDefaultCatalog = json.catalog != null && Object.keys(json.catalog).length > 0
    const hasNamedCatalogs = json.catalogs != null && Object.keys(json.catalogs).length > 0

    if (!hasDefaultCatalog && !hasNamedCatalogs)
      return null

    if (hasDefaultCatalog) {
      catalogs.push({
        name: 'default',
        packages: json.catalog!,
      })
    }

    if (hasNamedCatalogs) {
      for (const [name, packages] of Object.entries(json.catalogs!)) {
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
    const workspace = parsePnpmWorkspaceYaml(content)
    workspace.setPackage(catalogName, pkgName, version)
    fs.writeFileSync(config.filePath, workspace.toString())

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
