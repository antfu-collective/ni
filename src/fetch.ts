import type { Choice } from '@posva/prompts'
import process from 'node:process'
import c from 'ansis'
import { formatPackageWithUrl } from './utils'

export interface NpmPackage {
  name: string
  description: string
  version: string
  keywords: string[]
  date: string
  links: {
    npm: string
    homepage: string
    repository: string
  }
}

interface NpmRegistryResponse {
  objects: { package: NpmPackage }[]
}

export async function fetchNpmPackages(pattern: string): Promise<Choice[]> {
  const registryLink = (pattern: string) =>
    `https://registry.npmjs.com/-/v1/search?text=${pattern}&size=35`

  const terminalColumns = process.stdout?.columns || 80

  try {
    const result = await fetch(registryLink(pattern))
      .then(res => res.json()) as NpmRegistryResponse

    return result.objects.map(({ package: pkg }) => ({
      title: formatPackageWithUrl(
        `${pkg.name.padEnd(30, ' ')} ${c.blue`v${pkg.version}`}`,
        pkg.links.repository ?? pkg.links.npm,
        terminalColumns,
      ),
      value: pkg,
    }))
  }
  catch {
    console.error('Error when fetching npm registry')
    process.exit(1)
  }
}
