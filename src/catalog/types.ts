export interface CatalogInfo {
  name: string
  packages: Record<string, string>
}

export interface CatalogConfig {
  filePath: string
  catalogs: CatalogInfo[]
  hasDefaultCatalog: boolean
  hasNamedCatalogs: boolean
}

export interface CatalogProvider {
  detect: (cwd: string) => Promise<CatalogConfig | null>
  findPackage: (config: CatalogConfig, pkgName: string) => CatalogInfo | undefined
  addPackage: (config: CatalogConfig, catalogName: string, pkgName: string, version: string) => Promise<void>
}

export function getCatalogRef(catalogName: string): string {
  return catalogName === 'default' ? 'catalog:' : `catalog:${catalogName}`
}
