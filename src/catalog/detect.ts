import type { Agent } from 'package-manager-detector'
import type { CatalogProvider } from './types'
import { bunCatalogProvider } from './bun'
import { pnpmCatalogProvider } from './pnpm'
import { yarnCatalogProvider } from './yarn'

export function getCatalogProvider(agent: Agent): CatalogProvider | null {
  if (agent === 'pnpm')
    return pnpmCatalogProvider
  if (agent === 'yarn@berry')
    return yarnCatalogProvider
  if (agent === 'bun')
    return bunCatalogProvider
  return null
}
