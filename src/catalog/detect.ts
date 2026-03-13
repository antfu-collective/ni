import type { Agent } from 'package-manager-detector'
import type { CatalogProvider } from './types'
import { pnpmCatalogProvider } from './pnpm'

export function getCatalogProvider(agent: Agent): CatalogProvider | null {
  if (agent === 'pnpm')
    return pnpmCatalogProvider
  return null
}
